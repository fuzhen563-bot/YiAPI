package model

import "time"

type UserRiskConfig struct {
	Id              int    `json:"id"`
	UserId          int    `json:"user_id" gorm:"uniqueIndex"`
	DailyQuotaCap   int64  `json:"daily_quota_cap" gorm:"bigint;default:0"`        // 0 = unlimited
	ConcurrencyLimit int   `json:"concurrency_limit" gorm:"default:0"`             // 0 = unlimited
	ModelWhitelist  string `json:"model_whitelist" gorm:"type:text"`               // comma-separated, empty = all allowed
	IpWhitelist     string `json:"ip_whitelist" gorm:"type:text"`                  // comma-separated CIDR
	AlertThreshold  int64  `json:"alert_threshold" gorm:"bigint;default:0"`        // quota below this triggers alert, 0 = off
	CreatedAt       int64  `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt       int64  `json:"updated_at" gorm:"autoUpdateTime"`
}

type DailyUsage struct {
	Id        int   `json:"id"`
	UserId    int   `json:"user_id" gorm:"uniqueIndex:idx_user_date"`
	Date      string `json:"date" gorm:"type:varchar(10);uniqueIndex:idx_user_date"` // YYYY-MM-DD
	QuotaUsed int64 `json:"quota_used" gorm:"bigint;default:0"`
}

type AffiliateCommission struct {
	Id           int    `json:"id"`
	UserId       int    `json:"user_id" gorm:"index"`         // affiliate who earned
	InvitedUserId int   `json:"invited_user_id"`               // user who was invited
	Amount       int64  `json:"amount" gorm:"bigint;default:0"`
	Status       int    `json:"status" gorm:"default:0"`      // 0=pending, 1=settled, 2=cancelled
	CreatedAt    int64  `json:"created_at" gorm:"autoCreateTime"`
	SettledAt    int64  `json:"settled_at" gorm:"default:0"`
}

func init() {
}

func GetUserRiskConfig(userId int) (*UserRiskConfig, error) {
	var cfg UserRiskConfig
	err := DB.Where("user_id = ?", userId).First(&cfg).Error
	if err != nil {
		return &UserRiskConfig{UserId: userId}, nil
	}
	return &cfg, nil
}

func UpdateUserRiskConfig(cfg *UserRiskConfig) error {
	return DB.Save(cfg).Error
}

func GetDailyUsage(userId int, date string) (*DailyUsage, error) {
	var du DailyUsage
	err := DB.Where("user_id = ? AND date = ?", userId, date).First(&du).Error
	if err != nil {
		return &DailyUsage{UserId: userId, Date: date}, nil
	}
	return &du, nil
}

func IncrementDailyUsage(userId int, date string, quota int64) error {
	du, err := GetDailyUsage(userId, date)
	if err != nil {
		return err
	}
	du.QuotaUsed += quota
	return DB.Save(du).Error
}

func GetAffiliateCommissions(userId int, page, size int) ([]*AffiliateCommission, int64, error) {
	var items []*AffiliateCommission
	var total int64
	query := DB.Where("user_id = ?", userId)
	query.Count(&total)
	err := query.Order("id DESC").Offset((page - 1) * size).Limit(size).Find(&items).Error
	return items, total, err
}

func CreateAffiliateCommission(userId, invitedUserId int, amount int64) error {
	return DB.Create(&AffiliateCommission{
		UserId:        userId,
		InvitedUserId: invitedUserId,
		Amount:        amount,
		Status:        0,
		CreatedAt:     time.Now().Unix(),
	}).Error
}

func GetAffiliateTotalEarned(userId int) (int64, error) {
	var total int64
	err := DB.Model(&AffiliateCommission{}).Where("user_id = ? AND status = ?", userId, 1).Select("COALESCE(SUM(amount),0)").Scan(&total).Error
	return total, err
}

func GetInvitedUserCount(userId int) (int64, error) {
	var count int64
	err := DB.Model(&User{}).Where("inviter_id = ?", userId).Count(&count).Error
	return count, err
}
