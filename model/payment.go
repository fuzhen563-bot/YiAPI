package model

import (
	"errors"
	"fmt"
	"time"

	"yiapi/common"
	"yiapi/common/config"
	"yiapi/common/helper"
	"yiapi/common/logger"

	"gorm.io/gorm"
)

const (
	PaymentStatusPending = iota + 1
	PaymentStatusSuccess
	PaymentStatusFailed
	PaymentStatusExpired
)

const (
	PaymentMethodWeChat = "wechat"
	PaymentMethodAlipay = "alipay"
	PaymentMethodYiPay  = "yipay"
)

type Payment struct {
	Id            int    `json:"id"`
	UserId        int    `json:"user_id" gorm:"index"`
	OrderNo       string `json:"order_no" gorm:"type:varchar(64);uniqueIndex"`
	Amount        int64  `json:"amount" gorm:"bigint;default:0"`      // amount in cents (fen)
	Quota         int64  `json:"quota" gorm:"bigint;default:0"`       // quota to add
	PlanId        int    `json:"plan_id" gorm:"default:0"`            // 0 = direct topup
	PlanName      string `json:"plan_name" gorm:"type:varchar(64)"`
	Method        string `json:"method" gorm:"type:varchar(32)"`      // wechat / alipay / yipay
	Status        int    `json:"status" gorm:"type:int;default:1"`
	TradeNo       string `json:"trade_no" gorm:"type:varchar(128)"`   // platform trade no
	PayUrl        string `json:"pay_url" gorm:"type:varchar(512)"`    // payment QR/URL
	CreatedTime   int64  `json:"created_time" gorm:"bigint"`
	PaidTime      int64  `json:"paid_time" gorm:"bigint;default:0"`
	ExpiredTime   int64  `json:"expired_time" gorm:"bigint"`
}

func generateOrderNo() string {
	return fmt.Sprintf("%s%d", time.Now().Format("20060102150405"), helper.GetTimestamp()%100000)
}

func CreatePayment(userId int, amount int64, method string, planId int) (*Payment, error) {
	if !config.PaymentEnabled {
		return nil, errors.New("payment is not enabled")
	}
	if amount <= 0 && planId <= 0 {
		return nil, errors.New("invalid amount or plan")
	}

	var quota int64
	var planName string

	if planId > 0 {
		plan, err := GetTokenPlanById(planId)
		if err != nil {
			return nil, errors.New("plan not found")
		}
		if plan.Status != TokenPlanStatusEnabled {
			return nil, errors.New("plan is not available")
		}
		amount = plan.Price
		quota = plan.Quota
		planName = plan.Name
	} else {
		quota = amount * 100 // 1 cent = 100 quota (configurable)
	}

	now := helper.GetTimestamp()
	payment := &Payment{
		UserId:      userId,
		OrderNo:     generateOrderNo(),
		Amount:      amount,
		Quota:       quota,
		PlanId:      planId,
		PlanName:    planName,
		Method:      method,
		Status:      PaymentStatusPending,
		CreatedTime: now,
		ExpiredTime: now + 1800, // 30 min expiry
	}

	err := DB.Create(payment).Error
	if err != nil {
		return nil, errors.New("failed to create payment: " + err.Error())
	}
	return payment, nil
}

func GetPaymentById(id int) (*Payment, error) {
	if id == 0 {
		return nil, errors.New("id is empty")
	}
	p := Payment{Id: id}
	err := DB.First(&p, "id = ?", id).Error
	return &p, err
}

func GetPaymentByOrderNo(orderNo string) (*Payment, error) {
	p := Payment{}
	err := DB.Where("order_no = ?", orderNo).First(&p).Error
	return &p, err
}

func GetUserPayments(userId int, startIdx int, num int) ([]*Payment, error) {
	var list []*Payment
	err := DB.Where("user_id = ?", userId).Order("id desc").Limit(num).Offset(startIdx).Find(&list).Error
	return list, err
}

func GetAllPayments(startIdx int, num int) ([]*Payment, error) {
	var list []*Payment
	err := DB.Order("id desc").Limit(num).Offset(startIdx).Find(&list).Error
	return list, err
}

func ProcessPaymentSuccess(orderNo string, tradeNo string) error {
	payment, err := GetPaymentByOrderNo(orderNo)
	if err != nil {
		return errors.New("payment not found")
	}
	if payment.Status != PaymentStatusPending {
		return errors.New("payment already processed")
	}
	if payment.ExpiredTime > 0 && helper.GetTimestamp() > payment.ExpiredTime {
		DB.Model(payment).Update("status", PaymentStatusExpired)
		return errors.New("payment expired")
	}

	now := helper.GetTimestamp()
	err = DB.Transaction(func(tx *gorm.DB) error {
		err := tx.Model(payment).Updates(map[string]interface{}{
			"status":   PaymentStatusSuccess,
			"trade_no": tradeNo,
			"paid_time": now,
		}).Error
		if err != nil {
			return err
		}
		return tx.Model(&User{}).Where("id = ?", payment.UserId).
			Update("quota", gorm.Expr("quota + ?", payment.Quota)).Error
	})

	if err != nil {
		return err
	}

	logger.SysLogf("payment success: order=%s trade=%s user=%d quota=%d amount=%d",
		orderNo, tradeNo, payment.UserId, payment.Quota, payment.Amount)
	RecordLog(nil, payment.UserId, LogTypeTopup,
		fmt.Sprintf("payment success: %s +%s", payment.PlanName, common.LogQuota(payment.Quota)))
	return nil
}

func ExpirePayments() {
	now := helper.GetTimestamp()
	DB.Model(&Payment{}).
		Where("status = ? AND expired_time > 0 AND expired_time < ?", PaymentStatusPending, now).
		Update("status", PaymentStatusExpired)
}