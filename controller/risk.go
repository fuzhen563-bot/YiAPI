package controller

import (
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"yiapi/common/config"
	ctxkey "yiapi/common/ctxkey"
	"yiapi/model"
)

func GetUserRiskConfig(c *gin.Context) {
	id := c.GetInt(ctxkey.Id)
	cfg, err := model.GetUserRiskConfig(id)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"success": true, "message": "", "data": cfg})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "message": "", "data": cfg})
}

func UpdateUserRiskConfig(c *gin.Context) {
	id := c.GetInt(ctxkey.Id)
	var req struct {
		DailyQuotaCap    int64  `json:"daily_quota_cap"`
		ConcurrencyLimit int    `json:"concurrency_limit"`
		ModelWhitelist   string `json:"model_whitelist"`
		IpWhitelist      string `json:"ip_whitelist"`
		AlertThreshold   int64  `json:"alert_threshold"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "参数错误"})
		return
	}
	cfg, err := model.GetUserRiskConfig(id)
	if err != nil {
		cfg.UserId = id
	}
	cfg.DailyQuotaCap = req.DailyQuotaCap
	cfg.ConcurrencyLimit = req.ConcurrencyLimit
	cfg.ModelWhitelist = req.ModelWhitelist
	cfg.IpWhitelist = req.IpWhitelist
	cfg.AlertThreshold = req.AlertThreshold
	if err := model.UpdateUserRiskConfig(cfg); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "message": "已更新"})
}

func GetDailyUsage(c *gin.Context) {
	id := c.GetInt(ctxkey.Id)
	today := time.Now().Format("2006-01-02")
	du, err := model.GetDailyUsage(id, today)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"success": true, "data": gin.H{"date": today, "quota_used": 0}})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": du})
}

func GetAffiliateStats(c *gin.Context) {
	id := c.GetInt(ctxkey.Id)
	invitedCount, _ := model.GetInvitedUserCount(id)
	totalEarned, _ := model.GetAffiliateTotalEarned(id)
	var pendingEarned int64
	model.DB.Model(&model.AffiliateCommission{}).
		Where("user_id = ? AND status = ?", id, 0).
		Select("COALESCE(SUM(amount),0)").Scan(&pendingEarned)

	c.JSON(http.StatusOK, gin.H{"success": true, "data": gin.H{
		"invited_count":  invitedCount,
		"total_earned":   totalEarned,
		"pending_earned": pendingEarned,
		"quota_for_inviter": config.QuotaForInviter,
		"quota_for_invitee": config.QuotaForInvitee,
	}})
}

func GetAffiliateRecords(c *gin.Context) {
	id := c.GetInt(ctxkey.Id)
	page, _ := strconv.Atoi(c.Query("p"))
	if page < 1 {
		page = 1
	}
	items, total, err := model.GetAffiliateCommissions(id, page, config.ItemsPerPage)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"success": true, "data": []*model.AffiliateCommission{}, "total": 0})
		return
	}
	// enrich with invited usernames
	type Record struct {
		model.AffiliateCommission
		InvitedUsername string `json:"invited_username"`
	}
	result := make([]Record, 0, len(items))
	for _, item := range items {
		username := model.GetUsernameById(item.InvitedUserId)
		result = append(result, Record{AffiliateCommission: *item, InvitedUsername: username})
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": result, "total": total})
}

// RiskCheck middleware - checks daily quota cap
func RiskCheck() gin.HandlerFunc {
	return func(c *gin.Context) {
		userId := c.GetInt(ctxkey.Id)
		if userId == 0 {
			c.Next()
			return
		}
		cfg, err := model.GetUserRiskConfig(userId)
		if err == nil && cfg.DailyQuotaCap > 0 {
			today := time.Now().Format("2006-01-02")
			du, _ := model.GetDailyUsage(userId, today)
			if du != nil && du.QuotaUsed >= cfg.DailyQuotaCap {
				c.JSON(http.StatusTooManyRequests, gin.H{
					"success": false,
					"message": "今日额度已达上限",
				})
				c.Abort()
				return
			}
		}
		// Check model whitelist
		if err == nil && cfg.ModelWhitelist != "" {
			modelName := c.GetString("model_name")
			if modelName != "" {
				allowed := strings.Split(cfg.ModelWhitelist, ",")
				allowedMap := make(map[string]bool, len(allowed))
				for _, a := range allowed {
					allowedMap[strings.TrimSpace(a)] = true
				}
				if !allowedMap[modelName] {
					c.JSON(http.StatusForbidden, gin.H{
						"success": false,
						"message": "模型 " + modelName + " 不在白名单中",
					})
					c.Abort()
					return
				}
			}
		}
		c.Next()
	}
}
