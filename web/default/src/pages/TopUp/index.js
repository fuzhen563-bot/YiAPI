import React, { useEffect, useState } from 'react';
import {
  Button,
  Form,
  Grid,
  Header,
  Card,
  Statistic,
  Divider,
  Segment,
  Modal,
  Icon,
  Label,
} from 'semantic-ui-react';
import { API, showError, showInfo, showSuccess } from '../../helpers';
import { renderQuota } from '../../helpers/render';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const PAYMENT_METHODS = [
  { key: 'alipay', text: 'Alipay', icon: 'alipay' },
  { key: 'wechat', text: 'WeChat Pay', icon: 'wechat' },
  { key: 'yipay', text: 'YiPay', icon: 'payment' },
];

const TopUp = () => {
  const { t } = useTranslation();
  const [redemptionCode, setRedemptionCode] = useState('');
  const [userQuota, setUserQuota] = useState(0);
  const [user, setUser] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Payment state
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('alipay');
  const [payModal, setPayModal] = useState(false);
  const [payUrl, setPayUrl] = useState('');
  const [payOrderNo, setPayOrderNo] = useState('');
  const [payAmount, setPayAmount] = useState(0);
  const [payQuota, setPayQuota] = useState(0);
  const [polling, setPolling] = useState(false);
  const [topUpLink, setTopUpLink] = useState('');

  const PRESET_AMOUNTS = [5, 10, 20, 50, 100];

  const topUp = async () => {
    if (redemptionCode === '') {
      showInfo(t('topup.redeem_code.empty_code'));
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await API.post('/api/user/topup', { key: redemptionCode });
      const { success, message, data } = res.data;
      if (success) {
        showSuccess(t('topup.redeem_code.success'));
        setUserQuota((quota) => quota + data);
        setRedemptionCode('');
      } else {
        showError(message);
      }
    } catch (err) {
      showError(t('topup.redeem_code.request_failed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const createPayment = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      showInfo('Please enter a valid amount');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await API.post('/api/payment/create', {
        amount: Math.round(amt * 100),
        method: method,
        plan_id: 0,
      });
      const { success, message, data } = res.data;
      if (success) {
        setPayUrl(data.pay_url);
        setPayOrderNo(data.order_no);
        setPayAmount(data.amount);
        setPayQuota(data.quota);
        setPayModal(true);
        startPolling(data.id);
      } else {
        showError(message);
      }
    } catch (err) {
      showError('Payment request failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const startPolling = (paymentId) => {
    setPolling(true);
    const interval = setInterval(async () => {
      try {
        const res = await API.get(`/api/payment/${paymentId}`);
        const { success, data } = res.data;
        if (success && data.status === 2) {
          clearInterval(interval);
          setPolling(false);
          setPayModal(false);
          showSuccess('Payment successful!');
          const userRes = await API.get('/api/user/self');
          if (userRes.data.success) {
            setUserQuota(userRes.data.data.quota);
          }
        }
      } catch (e) {
        // ignore polling errors
      }
    }, 3000);
  };

  const getUserQuota = async () => {
    let res = await API.get('/api/user/self');
    const { success, message, data } = res.data;
    if (success) {
      setUserQuota(data.quota);
      setUser(data);
    } else {
      showError(message);
    }
  };

  useEffect(() => {
    getUserQuota().then();
    let status = localStorage.getItem('status');
    if (status) {
      status = JSON.parse(status);
      if (status.top_up_link) {
        setTopUpLink(status.top_up_link);
      }
    }
  }, []);

  const openTopUpLink = () => {
    if (!topUpLink) {
      showError(t('topup.redeem_code.no_link'));
      return;
    }
    let url = new URL(topUpLink);
    url.searchParams.append('username', user.username);
    url.searchParams.append('user_id', user.id);
    url.searchParams.append('transaction_id', crypto.randomUUID());
    window.open(url.toString(), '_blank');
  };

  return (
    <div className='dashboard-container'>
      {/* Payment Modal */}
      <Modal open={payModal} onClose={() => { setPayModal(false); setPolling(false); }} size='small'>
        <Modal.Header>{t('topup.payment.title')}</Modal.Header>
        <Modal.Content textAlign='center'>
          <div style={{ padding: '1em' }}>
            <Header as='h3'>
              {t('topup.payment.amount')}: ¥{(payAmount / 100).toFixed(2)}
            </Header>
            <p style={{ color: '#666' }}>
              {t('topup.payment.quota')}: {renderQuota(payQuota, t)}
            </p>
            <Divider />
            <p style={{ color: '#888', margin: '1em 0' }}>
              {t('topup.payment.scan_hint')}
            </p>
            {payUrl && (
              <a href={payUrl} target='_blank' rel='noreferrer'>
                <Button primary size='large' icon='external' content={t('topup.payment.open')} />
              </a>
            )}
            <Divider />
            <p style={{ fontSize: '12px', color: '#999' }}>
              {t('topup.payment.order_no')}: {payOrderNo}
            </p>
            {polling && (
              <div style={{ marginTop: '1em' }}>
                <Icon name='spinner' loading />
                <span style={{ marginLeft: '0.5em', color: '#888' }}>
                  {t('topup.payment.waiting')}
                </span>
              </div>
            )}
          </div>
        </Modal.Content>
        <Modal.Actions>
          <Button onClick={() => { setPayModal(false); setPolling(false); }}>
            {t('topup.payment.close')}
          </Button>
        </Modal.Actions>
      </Modal>

      <Card fluid className='chart-card'>
        <Card.Content>
          <Card.Header>
            <Header as='h2'>
              <Icon name='credit card' />
              {t('topup.title')}
            </Header>
          </Card.Header>

          {/* Quota display */}
          <Segment basic textAlign='center'>
            <Statistic>
              <Statistic.Value style={{ color: '#2185d0' }}>
                {renderQuota(userQuota, t)}
              </Statistic.Value>
              <Statistic.Label>{t('topup.get_code.current_quota')}</Statistic.Label>
            </Statistic>
          </Segment>

          <Grid columns={2} stackable doubling>
            {/* Online Payment */}
            <Grid.Column>
              <Card fluid>
                <Card.Content>
                  <Card.Header>
                    <Header as='h3' style={{ color: '#2185d0' }}>
                      <Icon name='payment' />
                      {t('topup.payment.online_pay')}
                    </Header>
                  </Card.Header>
                  <Card.Description>
                    {/* Preset amounts */}
                    <div style={{ marginBottom: '1em' }}>
                      <Label style={{ marginBottom: '0.5em', display: 'block' }}>
                        {t('topup.payment.select_amount')}
                      </Label>
                      <Button.Group>
                        {PRESET_AMOUNTS.map((a) => (
                          <Button
                            key={a}
                            toggle
                            active={parseFloat(amount) === a}
                            onClick={() => setAmount(String(a))}
                            size='small'
                          >
                            ¥{a}
                          </Button>
                        ))}
                      </Button.Group>
                    </div>

                    <Form.Input
                      fluid
                      icon='money'
                      iconPosition='left'
                      label={t('topup.payment.custom_amount')}
                      placeholder='0.00'
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      type='number'
                      step='0.01'
                      min='0'
                    />

                    {/* Payment method selection */}
                    <div style={{ margin: '1em 0' }}>
                      <Label style={{ marginBottom: '0.5em', display: 'block' }}>
                        {t('topup.payment.method')}
                      </Label>
                      <Button.Group>
                        {PAYMENT_METHODS.map((pm) => (
                          <Button
                            key={pm.key}
                            toggle
                            active={method === pm.key}
                            onClick={() => setMethod(pm.key)}
                            size='small'
                          >
                            <Icon name={pm.icon} />
                            {pm.text}
                          </Button>
                        ))}
                      </Button.Group>
                    </div>

                    <Button
                      primary
                      fluid
                      size='large'
                      onClick={createPayment}
                      loading={isSubmitting}
                      disabled={isSubmitting}
                    >
                      {t('topup.payment.pay_now')}
                    </Button>

                    {topUpLink && (
                      <>
                        <Divider horizontal>{t('common.or')}</Divider>
                        <Button
                          basic
                          color='blue'
                          fluid
                          size='large'
                          onClick={openTopUpLink}
                        >
                          <Icon name='external' />
                          {t('topup.get_code.button')}
                        </Button>
                      </>
                    )}
                  </Card.Description>
                </Card.Content>
              </Card>
            </Grid.Column>

            {/* Redeem Code */}
            <Grid.Column>
              <Card fluid>
                <Card.Content>
                  <Card.Header>
                    <Header as='h3' style={{ color: '#21ba45' }}>
                      <Icon name='ticket alternate' />
                      {t('topup.redeem_code.title')}
                    </Header>
                  </Card.Header>
                  <Card.Description>
                    <Form.Input
                      fluid
                      icon='key'
                      iconPosition='left'
                      placeholder={t('topup.redeem_code.placeholder')}
                      value={redemptionCode}
                      onChange={(e) => setRedemptionCode(e.target.value)}
                      onPaste={(e) => {
                        e.preventDefault();
                        const pastedText = e.clipboardData.getData('text');
                        setRedemptionCode(pastedText.trim());
                      }}
                      action={
                        <Button
                          icon='paste'
                          content={t('topup.redeem_code.paste')}
                          onClick={async () => {
                            try {
                              const text = await navigator.clipboard.readText();
                              setRedemptionCode(text.trim());
                            } catch (err) {
                              showError(t('topup.redeem_code.paste_error'));
                            }
                          }}
                        />
                      }
                    />
                    <div style={{ marginTop: '1em' }}>
                      <Button
                        color='green'
                        fluid
                        size='large'
                        onClick={topUp}
                        loading={isSubmitting}
                        disabled={isSubmitting}
                      >
                        {isSubmitting
                          ? t('topup.redeem_code.submitting')
                          : t('topup.redeem_code.submit')}
                      </Button>
                    </div>
                  </Card.Description>
                </Card.Content>
              </Card>
            </Grid.Column>
          </Grid>

          <Divider />
          <div style={{ textAlign: 'center' }}>
            <Button as={Link} to='/payment/records' basic icon='history' content={t('topup.payment.records')} />
          </div>
        </Card.Content>
      </Card>
    </div>
  );
};

export default TopUp;