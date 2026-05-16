package controller

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"yiapi/common/config"
	"yiapi/common/ctxkey"
	"yiapi/model"
)

// ---- User Plan ----

func GetMyActivePlan(c *gin.Context) {
	id := c.GetInt(ctxkey.Id)
	plan, err := model.GetUserActivePlan(id)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"success": true, "data": nil})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": plan})
}

func GetMyPlans(c *gin.Context) {
	id := c.GetInt(ctxkey.Id)
	plans, err := model.GetUserPlans(id, 0, 100)
	if err != nil || plans == nil {
		plans = []*model.UserPlan{}
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": plans})
}

func PurchasePlanHandler(c *gin.Context) {
	userId := c.GetInt(ctxkey.Id)
	var req struct {
		PlanId int `json:"plan_id"`
	}
	if err := c.ShouldBindJSON(&req); err != nil || req.PlanId == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "参数错误"})
		return
	}
	userPlan, err := model.PurchasePlan(userId, req.PlanId)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "message": "购买成功", "data": userPlan})
}

// ---- Resource Pack ----

func GetMyResourcePacks(c *gin.Context) {
	id := c.GetInt(ctxkey.Id)
	packs, _ := model.GetUserResourcePacks(id)
	if packs == nil {
		packs = []*model.UserResourcePack{}
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": packs})
}

// ---- Announcement ----

func GetAnnouncements(c *gin.Context) {
	items, _ := model.GetPublishedAnnouncements()
	if items == nil {
		items = []*model.Announcement{}
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": items})
}

func AdminGetAnnouncements(c *gin.Context) {
	page, _ := strconv.Atoi(c.Query("p"))
	if page < 1 {
		page = 1
	}
	items, total, _ := model.GetAllAnnouncements(page, config.ItemsPerPage)
	if items == nil {
		items = []*model.Announcement{}
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": items, "total": total})
}

func CreateAnnouncement(c *gin.Context) {
	var a model.Announcement
	if err := c.ShouldBindJSON(&a); err != nil {
		return
	}
	a.Status = 1
	a.CreatedAt = time.Now().Unix()
	if err := model.CreateAnnouncement(&a); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "message": "已创建"})
}

func UpdateAnnouncement(c *gin.Context) {
	var a model.Announcement
	if err := c.ShouldBindJSON(&a); err != nil {
		return
	}
	if err := model.UpdateAnnouncement(&a); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "message": "已更新"})
}

func DeleteAnnouncement(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	if err := model.DeleteAnnouncement(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "message": "已删除"})
}

// ---- Usage Stats ----

type UsageStats struct {
	TotalRequests     int    `json:"total_requests"`
	TotalTokens       int    `json:"total_tokens"`
	TotalQuota        int64  `json:"total_quota"`
	TodayRequests     int    `json:"today_requests"`
	TodayTokens       int    `json:"today_tokens"`
	TodayQuota        int64  `json:"today_quota"`
	PlanQuotaRemaining int64 `json:"plan_quota_remaining"`
	PlanQuotaTotal    int64  `json:"plan_quota_total"`
	Balance           int64  `json:"balance"`
}

func GetUsageStats(c *gin.Context) {
	userId := c.GetInt(ctxkey.Id)
	now := time.Now()
	startOfDay := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location()).Unix()

	stats := model.GetUserLogStats(userId)

	plan, err := model.GetUserActivePlan(userId)
	var planRemaining, planTotal int64
	if err == nil && plan != nil {
		planTotal = plan.Quota
		planRemaining = plan.RemainingQuota
	}

	var todayStats struct {
		Quota   int64
		Tokens  int
		Count   int
	}
	model.DB.Raw(`SELECT COALESCE(SUM(quota),0) as quota, COALESCE(SUM(prompt_tokens+completion_tokens),0) as tokens, COUNT(*) as count
		FROM logs WHERE user_id = ? AND created_at >= ?`, userId, startOfDay).Scan(&todayStats)

	user, _ := model.GetUserById(userId, false)
	var balance int64
	if user != nil {
		balance = user.Quota
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": UsageStats{
		TotalRequests:      stats.RequestCount,
		TotalTokens:        stats.PromptTokens + stats.CompletionTokens,
		TotalQuota:         int64(stats.Quota),
		TodayRequests:      todayStats.Count,
		TodayTokens:        todayStats.Tokens,
		TodayQuota:         todayStats.Quota,
		PlanQuotaRemaining: planRemaining,
		PlanQuotaTotal:     planTotal,
		Balance:            balance,
	}})
}

// ---- Extended User Self ----
func GetUserSelfExtended(c *gin.Context) {
	userId := c.GetInt(ctxkey.Id)
	user, err := model.GetUserById(userId, false)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "用户不存在"})
		return
	}

	plan, _ := model.GetUserActivePlan(userId)
	invitedCount, _ := model.GetInvitedUserCount(userId)
	totalEarned, _ := model.GetAffiliateTotalEarned(userId)

	var planRemaining int64
	if plan != nil {
		planRemaining = plan.RemainingQuota
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": gin.H{
		"user":                user,
		"active_plan":         plan,
		"plan_quota_remaining": planRemaining,
		"invited_count":       invitedCount,
		"affiliate_earned":    totalEarned,
	}})
}
