package controller

import (
	"crypto/md5"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"yiapi/common"
	"yiapi/common/config"
	"yiapi/common/helper"
	"yiapi/common/logger"
	"yiapi/model"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func DirectTopUp(c *gin.Context) {
	if !config.DirectTopupEnabled {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "direct topup is not enabled",
		})
		return
	}

	// Support both GET and POST
	userIDStr := c.DefaultQuery("user_id", c.DefaultPostForm("user_id", ""))
	amountStr := c.DefaultQuery("amount", c.DefaultPostForm("amount", ""))
	key := c.DefaultQuery("key", c.DefaultPostForm("key", ""))
	sign := c.DefaultQuery("sign", c.DefaultPostForm("sign", ""))

	if userIDStr == "" || amountStr == "" || key == "" || sign == "" {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "missing required parameters: user_id, amount, key, sign",
		})
		return
	}

	if key != config.DirectTopupKey {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "invalid key",
		})
		return
	}

	userID, err := strconv.Atoi(userIDStr)
	if err != nil || userID <= 0 {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "invalid user_id",
		})
		return
	}

	amount, err := strconv.ParseInt(amountStr, 10, 64)
	if err != nil || amount <= 0 {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "invalid amount",
		})
		return
	}

	// Verify sign: MD5(user_id + amount + key + secret)
	expectedSign := fmt.Sprintf("%x", md5.Sum([]byte(userIDStr+amountStr+key+config.DirectTopupKey)))
	if !strings.EqualFold(sign, expectedSign) {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "invalid sign",
		})
		return
	}

	// Verify user exists
	user, err := model.GetUserById(userID, false)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "user not found",
		})
		return
	}

	// Apply top-up
	err = model.DB.Model(&model.User{}).Where("id = ?", userID).
		Update("quota", gorm.Expr("quota + ?", amount)).Error
	if err != nil {
		logger.SysError("direct topup failed: " + err.Error())
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "topup failed",
		})
		return
	}

	model.RecordLog(nil, userID, model.LogTypeTopup,
		fmt.Sprintf("direct topup +%s", common.LogQuota(amount)))

	logger.SysLogf("direct topup success: user=%d amount=%d username=%s", userID, amount, user.Username)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "success",
		"data": gin.H{
			"user_id":  userID,
			"amount":   amount,
			"username": user.Username,
			"balance":  helper.GetTimestamp(),
		},
	})
}