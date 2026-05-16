package model

import "time"

// UserResourcePack - 加量包
type UserResourcePack struct {
	Id              int    `json:"id"`
	UserId          int    `json:"user_id" gorm:"index"`
	Name            string `json:"name"`
	TotalQuota      int64  `json:"total_quota"`
	RemainingQuota  int64  `json:"remaining_quota"`
	ExpiredAt       int64  `json:"expired_at"`         // 0 = never expire
	Status          int    `json:"status" gorm:"default:1"` // 1=active, 2=expired, 3=used
	CreatedAt       int64  `json:"created_at" gorm:"autoCreateTime"`
}

// Announcement - 公告
type Announcement struct {
	Id        int    `json:"id"`
	Title     string `json:"title"`
	Content   string `json:"content" gorm:"type:text"`
	Priority  int    `json:"priority" gorm:"default:0"` // 0=normal, 1=important
	Status    int    `json:"status" gorm:"default:1"`   // 1=published, 2=draft
	CreatedAt int64  `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt int64  `json:"updated_at" gorm:"autoUpdateTime"`
}

func init() {
}

// ---- UserResourcePack ----

func GetUserActiveResourcePacks(userId int) ([]*UserResourcePack, error) {
	var packs []*UserResourcePack
	now := time.Now().Unix()
	err := DB.Where("user_id = ? AND status = 1 AND (expired_at = 0 OR expired_at > ?)", userId, now).
		Order("id ASC").Find(&packs).Error
	return packs, err
}

func GetUserResourcePacks(userId int) ([]*UserResourcePack, error) {
	var packs []*UserResourcePack
	err := DB.Where("user_id = ?", userId).Order("id DESC").Find(&packs).Error
	return packs, err
}

func CreateUserResourcePack(pack *UserResourcePack) error {
	return DB.Create(pack).Error
}

func DeductResourcePack(packId int, quota int64) error {
	return DB.Model(&UserResourcePack{}).Where("id = ? AND remaining_quota >= ?", packId, quota).
		Update("remaining_quota", DB.Raw("remaining_quota - ?", quota)).Error
}

// ---- Announcement ----

func GetPublishedAnnouncements() ([]*Announcement, error) {
	var items []*Announcement
	err := DB.Where("status = 1").Order("priority DESC, id DESC").Find(&items).Error
	return items, err
}

func GetAllAnnouncements(page, size int) ([]*Announcement, int64, error) {
	var items []*Announcement
	var total int64
	DB.Model(&Announcement{}).Count(&total)
	err := DB.Order("priority DESC, id DESC").Offset((page - 1) * size).Limit(size).Find(&items).Error
	return items, total, err
}

func CreateAnnouncement(a *Announcement) error {
	return DB.Create(a).Error
}

func UpdateAnnouncement(a *Announcement) error {
	return DB.Save(a).Error
}

func DeleteAnnouncement(id int) error {
	return DB.Delete(&Announcement{}, id).Error
}

// ---- Consumption Priority ----

func ConsumeQuotaWithPriority(userId int, quota int64) error {
	remaining := quota

	plan, err := GetUserActivePlan(userId)
	if err == nil && plan != nil {
		deduct := min64(remaining, plan.RemainingQuota)
		if deduct > 0 {
			DB.Model(plan).Update("remaining_quota", DB.Raw("remaining_quota - ?", deduct))
			remaining -= deduct
		}
	}

	if remaining > 0 {
		packs, _ := GetUserActiveResourcePacks(userId)
		for _, pack := range packs {
			if remaining <= 0 {
				break
			}
			deduct := min64(remaining, pack.RemainingQuota)
			if deduct > 0 {
				DeductResourcePack(pack.Id, deduct)
				remaining -= deduct
			}
		}
	}

	if remaining > 0 {
		return DecreaseUserQuota(userId, remaining)
	}
	return nil
}

func GetUserActivePlan(userId int) (*UserPlan, error) {
	var plan UserPlan
	now := time.Now().Unix()
	err := DB.Where("user_id = ? AND status = ? AND (expired_time = -1 OR expired_time > ?)", userId, UserPlanStatusActive, now).First(&plan).Error
	return &plan, err
}

func GetUserLogStats(userId int) LogStatistic {
	var stats LogStatistic
	DB.Raw(`SELECT COALESCE(COUNT(*),0) as request_count, COALESCE(SUM(quota),0) as quota, 
		COALESCE(SUM(prompt_tokens),0) as prompt_tokens, COALESCE(SUM(completion_tokens),0) as completion_tokens 
		FROM logs WHERE user_id = ?`, userId).Scan(&stats)
	return stats
}

func min64(a, b int64) int64 {
	if a < b {
		return a
	}
	return b
}
