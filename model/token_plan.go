package model

import (
	"errors"
	"time"

	"yiapi/common"
	"yiapi/common/helper"

	"gorm.io/gorm"
)

const (
	TokenPlanStatusEnabled  = 1
	TokenPlanStatusDisabled = 2
)

const (
	UserPlanStatusActive  = 1
	UserPlanStatusExpired = 2
	UserPlanStatusUsed    = 3
)

type TokenPlan struct {
	Id           int    `json:"id"`
	Name         string `json:"name" gorm:"type:varchar(64);index" validate:"max=64"`
	Description  string `json:"description" gorm:"type:varchar(255)"`
	Quota        int64  `json:"quota" gorm:"bigint;default:0"`
	Price        int64  `json:"price" gorm:"bigint;default:0"`
	DurationDays int    `json:"duration_days" gorm:"type:int;default:30"`
	Status       int    `json:"status" gorm:"type:int;default:1"`
	CreatedTime  int64  `json:"created_time" gorm:"bigint"`
	UpdatedTime  int64  `json:"updated_time" gorm:"bigint"`
}

type UserPlan struct {
	Id             int    `json:"id"`
	UserId         int    `json:"user_id" gorm:"index"`
	PlanId         int    `json:"plan_id" gorm:"index"`
	PlanName       string `json:"plan_name" gorm:"type:varchar(64)"`
	Quota          int64  `json:"quota" gorm:"bigint;default:0"`
	RemainingQuota int64  `json:"remaining_quota" gorm:"bigint;default:0"`
	Price          int64  `json:"price" gorm:"bigint;default:0"`
	Status         int    `json:"status" gorm:"type:int;default:1"`
	ExpiredTime    int64  `json:"expired_time" gorm:"bigint;default:-1"`
	CreatedTime    int64  `json:"created_time" gorm:"bigint"`
}

func GetAllTokenPlans(startIdx int, num int) ([]*TokenPlan, error) {
	var plans []*TokenPlan
	err := DB.Order("id desc").Limit(num).Offset(startIdx).Find(&plans).Error
	return plans, err
}

func SearchTokenPlans(keyword string) (plans []*TokenPlan, err error) {
	err = DB.Where("id = ? OR name LIKE ?", keyword, keyword+"%").Find(&plans).Error
	return plans, err
}

func GetTokenPlanById(id int) (*TokenPlan, error) {
	if id == 0 {
		return nil, errors.New("id is empty")
	}
	plan := TokenPlan{Id: id}
	err := DB.First(&plan, "id = ?", id).Error
	return &plan, err
}

func GetEnabledTokenPlans() ([]*TokenPlan, error) {
	var plans []*TokenPlan
	err := DB.Where("status = ?", TokenPlanStatusEnabled).Order("id asc").Find(&plans).Error
	return plans, err
}

func (plan *TokenPlan) Insert() error {
	plan.CreatedTime = helper.GetTimestamp()
	plan.UpdatedTime = helper.GetTimestamp()
	return DB.Create(plan).Error
}

func (plan *TokenPlan) Update() error {
	plan.UpdatedTime = helper.GetTimestamp()
	return DB.Model(plan).Select("name", "description", "quota", "price", "duration_days", "status", "updated_time").Updates(plan).Error
}

func (plan *TokenPlan) Delete() error {
	return DB.Delete(plan).Error
}

func DeleteTokenPlanById(id int) error {
	if id == 0 {
		return errors.New("id is empty")
	}
	plan := TokenPlan{Id: id}
	err := DB.Where(plan).First(&plan).Error
	if err != nil {
		return err
	}
	return plan.Delete()
}

func PurchasePlan(userId int, planId int) (*UserPlan, error) {
	if userId == 0 || planId == 0 {
		return nil, errors.New("invalid user or plan")
	}

	plan, err := GetTokenPlanById(planId)
	if err != nil {
		return nil, errors.New("plan not found")
	}
	if plan.Status != TokenPlanStatusEnabled {
		return nil, errors.New("plan is not available")
	}

	now := helper.GetTimestamp()
	var expiredTime int64 = -1
	if plan.DurationDays > 0 {
		expiredTime = now + int64(plan.DurationDays)*86400
	}

	userPlan := &UserPlan{
		UserId:         userId,
		PlanId:         plan.Id,
		PlanName:       plan.Name,
		Quota:          plan.Quota,
		RemainingQuota: plan.Quota,
		Price:          plan.Price,
		Status:         UserPlanStatusActive,
		ExpiredTime:    expiredTime,
		CreatedTime:    now,
	}

	err = DB.Transaction(func(tx *gorm.DB) error {
		err = tx.Create(userPlan).Error
		if err != nil {
			return err
		}
		err = tx.Model(&User{}).Where("id = ?", userId).Update("quota", gorm.Expr("quota + ?", plan.Quota)).Error
		return err
	})

	if err != nil {
		return nil, errors.New("purchase failed: " + err.Error())
	}

	RecordLog(nil, userId, LogTypeTopup, "Purchased plan: "+plan.Name+" +"+common.LogQuota(plan.Quota))
	return userPlan, nil
}

func GetUserPlans(userId int, startIdx int, num int) ([]*UserPlan, error) {
	var plans []*UserPlan
	err := DB.Where("user_id = ?", userId).Order("id desc").Limit(num).Offset(startIdx).Find(&plans).Error
	return plans, err
}

func GetAllUserPlans(startIdx int, num int) ([]*UserPlan, error) {
	var plans []*UserPlan
	err := DB.Order("id desc").Limit(num).Offset(startIdx).Find(&plans).Error
	return plans, err
}

func CleanExpiredUserPlans() {
	now := time.Now().Unix()
	DB.Model(&UserPlan{}).
		Where("status = ? AND expired_time > 0 AND expired_time < ?", UserPlanStatusActive, now).
		Update("status", UserPlanStatusExpired)
}