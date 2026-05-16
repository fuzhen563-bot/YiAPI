const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'src/locales/zh/translation.json');
let data = JSON.parse(fs.readFileSync(file, 'utf8'));

// Header
data.header.home = '首页';
data.header.models = '模型广场';
data.header.channel = '渠道';
data.header.token = '令牌';
data.header.redemption = '兑换';
data.header.plan = '套餐';
data.header.plan_manage = '套餐管理';
data.header.topup = '充值';
data.header.user = '用户';
data.header.dashboard = '总览';
data.header.log = '日志';
data.header.setting = '设置';
data.header.about = '关于';
data.header.chat = '聊天';
data.header.login = '登录';
data.header.logout = '注销';
data.header.register = '注册';
data.header.dark_mode = '深色模式';
data.header.light_mode = '浅色模式';

// TopUp
data.topup.title = '充值中心';
data.topup.get_code.title = '获取兑换码';
data.topup.get_code.current_quota = '当前可用额度';
data.topup.get_code.button = '立即获取兑换码';
data.topup.redeem_code.title = '兑换码充值';
data.topup.redeem_code.placeholder = '请输入兑换码';
data.topup.redeem_code.paste = '粘贴';
data.topup.redeem_code.paste_error = '无法访问剪贴板，请手动粘贴';
data.topup.redeem_code.submit = '立即兑换';
data.topup.redeem_code.submitting = '兑换中...';
data.topup.redeem_code.empty_code = '请输入兑换码！';
data.topup.redeem_code.success = '充值成功！';
data.topup.redeem_code.request_failed = '请求失败';
data.topup.redeem_code.no_link = '超级管理员未设置充值链接！';
data.topup.payment.title = '支付';
data.topup.payment.online_pay = '在线支付';
data.topup.payment.select_amount = '选择金额';
data.topup.payment.custom_amount = '自定义金额';
data.topup.payment.method = '支付方式';
data.topup.payment.pay_now = '立即支付';
data.topup.payment.records = '支付记录';
data.topup.payment.open = '打开支付页面';
data.topup.payment.scan_hint = '请在打开的页面中完成支付';
data.topup.payment.order_no = '订单号';
data.topup.payment.waiting = '等待支付中...';
data.topup.payment.close = '关闭';
data.topup.payment.amount = '金额';
data.topup.payment.quota = '额度';

// Common
data.common.or = '或';

// Models
data.models.title = '模型广场';
data.models.search = '搜索模型...';
data.models.load_failed = '加载模型列表失败';
data.models.empty = '暂无可用模型';
data.models.detail.object = '对象';
data.models.detail.created = '创建时间';
data.models.detail.owned_by = '所属';
data.models.detail.close = '关闭';

// Token Plan
data.token_plan.title = '套餐管理';
data.token_plan.search = '搜索套餐的 ID 和名称...';
data.token_plan.days = '天';
data.token_plan.unlimited = '不限';
data.token_plan.table.id = 'ID';
data.token_plan.table.name = '名称';
data.token_plan.table.status = '状态';
data.token_plan.table.quota = '额度';
data.token_plan.table.price = '价格';
data.token_plan.table.duration = '有效期';
data.token_plan.table.created_time = '创建时间';
data.token_plan.table.actions = '操作';
data.token_plan.status.enabled = '已启用';
data.token_plan.status.disabled = '已禁用';
data.token_plan.status.unknown = '未知状态';
data.token_plan.buttons.delete = '删除';
data.token_plan.buttons.confirm_delete = '确认删除';
data.token_plan.buttons.enable = '启用';
data.token_plan.buttons.disable = '禁用';
data.token_plan.buttons.edit = '编辑';
data.token_plan.buttons.add = '添加新的套餐';
data.token_plan.buttons.refresh = '刷新';
data.token_plan.edit.title_edit = '更新套餐信息';
data.token_plan.edit.title_create = '创建新的套餐';
data.token_plan.edit.name = '名称';
data.token_plan.edit.name_placeholder = '请输入套餐名称';
data.token_plan.edit.description = '描述';
data.token_plan.edit.description_placeholder = '请输入套餐描述';
data.token_plan.edit.quota = '额度';
data.token_plan.edit.quota_placeholder = '请输入额度数量';
data.token_plan.edit.price = '价格（分）';
data.token_plan.edit.price_placeholder = '请输入价格（单位：分，例如 100 = 1 元）';
data.token_plan.edit.duration = '有效期（天）';
data.token_plan.edit.duration_placeholder = '请输入有效天数，0 表示不限';
data.token_plan.edit.buttons.submit = '提交';
data.token_plan.edit.buttons.cancel = '取消';
data.token_plan.messages.operation_success = '操作成功完成！';
data.token_plan.messages.update_success = '套餐更新成功！';
data.token_plan.messages.create_success = '套餐创建成功！';
data.token_plan.purchase.title = '购买套餐';
data.token_plan.purchase.load_failed = '加载数据失败';
data.token_plan.purchase.success = '套餐购买成功！';
data.token_plan.purchase.request_failed = '购买请求失败';
data.token_plan.purchase.no_plans = '暂无可用套餐';
data.token_plan.purchase.quota = '包含额度';
data.token_plan.purchase.duration = '有效期';
data.token_plan.purchase.buy_now = '立即购买';

// Payment
data.payment.status.pending = '待支付';
data.payment.status.success = '支付成功';
data.payment.status.failed = '支付失败';
data.payment.status.expired = '已过期';
data.payment.status.unknown = '未知';
data.payment.records.title = '支付记录';
data.payment.records.order = '订单号';
data.payment.records.amount = '金额';
data.payment.records.quota = '额度';
data.payment.records.method = '方式';
data.payment.records.status = '状态';
data.payment.records.time = '时间';
data.payment.records.refresh = '刷新';

fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
console.log('Chinese translations applied successfully');