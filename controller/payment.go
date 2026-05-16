package controller

import (
	"crypto/md5"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"sort"
	"strconv"
	"strings"

	"yiapi/common/config"
	"yiapi/common/logger"
	"yiapi/model"

	"github.com/gin-gonic/gin"
)

type createPaymentRequest struct {
	Amount  int64  `json:"amount"`
	Method  string `json:"method"`
	PlanId  int    `json:"plan_id"`
}

func CreatePayment(c *gin.Context) {
	var req createPaymentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": err.Error()})
		return
	}

	if req.Amount <= 0 && req.PlanId <= 0 {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": "invalid amount or plan"})
		return
	}

	userId := c.GetInt("id")
	payment, err := model.CreatePayment(userId, req.Amount, req.Method, req.PlanId)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": err.Error()})
		return
	}

	// Build payment URL based on method
	var payUrl string
	switch req.Method {
	case model.PaymentMethodYiPay:
		payUrl = buildYiPayUrl(payment)
	case model.PaymentMethodWeChat, model.PaymentMethodAlipay:
		payUrl = buildYiPayUrl(payment) // fallback to yipay for now
	default:
		payUrl = buildYiPayUrl(payment)
	}

	if payUrl == "" {
		payUrl = payment.PayUrl
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data": gin.H{
			"id":       payment.Id,
			"order_no": payment.OrderNo,
			"amount":   payment.Amount,
			"quota":    payment.Quota,
			"pay_url":  payUrl,
		},
	})
}

func buildYiPayUrl(payment *model.Payment) string {
	if config.YiPayApiUrl == "" || config.YiPayPid == "" || config.YiPayKey == "" {
		return ""
	}

	params := map[string]string{
		"pid":          config.YiPayPid,
		"type":         payment.Method,
		"out_trade_no": payment.OrderNo,
		"notify_url":   config.YiPayNotifyUrl,
		"return_url":   config.YiPayReturnUrl,
		"name":         "YiAPI TopUp",
		"money":        fmt.Sprintf("%.2f", float64(payment.Amount)/100),
		"sign_type":    "MD5",
	}

	// Sort params and build sign string
	keys := make([]string, 0, len(params))
	for k := range params {
		keys = append(keys, k)
	}
	sort.Strings(keys)

	var signStr string
	for _, k := range keys {
		signStr += k + "=" + params[k] + "&"
	}
	signStr += "key=" + config.YiPayKey

	sign := fmt.Sprintf("%x", md5.Sum([]byte(signStr)))

	// Build full URL
	apiUrl := strings.TrimRight(config.YiPayApiUrl, "/") + "/submit.php?"
	values := url.Values{}
	for k, v := range params {
		values.Set(k, v)
	}
	values.Set("sign", sign)
	values.Set("sign_type", "MD5")

	return apiUrl + values.Encode()
}

func YiPayNotify(c *gin.Context) {
	body, _ := io.ReadAll(c.Request.Body)
	c.Request.Body = io.NopCloser(strings.NewReader(string(body)))

	c.Request.ParseForm()
	params := c.Request.Form

	// Verify sign
	receivedSign := params.Get("sign")

	keys := make([]string, 0, len(params))
	for k := range params {
		if k == "sign" || k == "sign_type" {
			continue
		}
		keys = append(keys, k)
	}
	sort.Strings(keys)

	var signStr string
	for _, k := range keys {
		signStr += k + "=" + params.Get(k) + "&"
	}
	signStr += "key=" + config.YiPayKey
	expectedSign := fmt.Sprintf("%x", md5.Sum([]byte(signStr)))

	if receivedSign != expectedSign {
		logger.SysLog("yipay notify: invalid sign")
		c.String(http.StatusOK, "fail")
		return
	}

	// Check trade status
	tradeStatus := params.Get("trade_status")
	if tradeStatus != "TRADE_SUCCESS" {
		c.String(http.StatusOK, "fail")
		return
	}

	orderNo := params.Get("out_trade_no")
	tradeNo := params.Get("trade_no")

	err := model.ProcessPaymentSuccess(orderNo, tradeNo)
	if err != nil {
		logger.SysLog("yipay notify error: " + err.Error())
		c.String(http.StatusOK, "fail")
		return
	}

	c.String(http.StatusOK, "success")
}

func QueryPayment(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": err.Error()})
		return
	}
	payment, err := model.GetPaymentById(id)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    payment,
	})
}

func GetUserPayments(c *gin.Context) {
	userId := c.GetInt("id")
	p, _ := strconv.Atoi(c.Query("p"))
	if p < 0 {
		p = 0
	}
	list, err := model.GetUserPayments(userId, p*config.ItemsPerPage, config.ItemsPerPage)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    list,
	})
}

func GetAllPayments(c *gin.Context) {
	p, _ := strconv.Atoi(c.Query("p"))
	if p < 0 {
		p = 0
	}
	list, err := model.GetAllPayments(p*config.ItemsPerPage, config.ItemsPerPage)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    list,
	})
}