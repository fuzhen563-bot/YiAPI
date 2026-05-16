import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Card,
  Icon,
  Label,
  Table,
  Pagination,
} from 'semantic-ui-react';
import { API, showError, timestamp2string } from '../../helpers';
import { renderQuota } from '../../helpers/render';
import { ITEMS_PER_PAGE } from '../../constants';

const STATUS_MAP = { 1: 'pending', 2: 'success', 3: 'failed', 4: 'expired' };

const PaymentRecords = () => {
  const { t } = useTranslation();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState(1);

  const loadPayments = async (startIdx) => {
    const res = await API.get(`/api/payment/user?p=${startIdx}`);
    const { success, message, data } = res.data;
    if (success) {
      if (startIdx === 0) {
        setPayments(data);
      } else {
        setPayments((prev) => [...prev, ...data]);
      }
    } else {
      showError(message);
    }
    setLoading(false);
  };

  const onPaginationChange = (e, { activePage }) => {
    (async () => {
      if (activePage === Math.ceil(payments.length / ITEMS_PER_PAGE) + 1) {
        await loadPayments(activePage - 1);
      }
      setActivePage(activePage);
    })();
  };

  useEffect(() => {
    loadPayments(0).then().catch(showError);
  }, []);

  const renderStatus = (status) => {
    const s = STATUS_MAP[status] || 'unknown';
    const colors = { pending: 'orange', success: 'green', failed: 'red', expired: 'grey' };
    return <Label basic color={colors[s]}>{t(`payment.status.${s}`)}</Label>;
  };

  return (
    <div className='dashboard-container'>
      <Card fluid className='chart-card'>
        <Card.Content>
          <Card.Header className='header'>
            <Icon name='history' />
            {t('payment.records.title')}
          </Card.Header>
          <Table basic='very' compact size='small'>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>{t('payment.records.order')}</Table.HeaderCell>
                <Table.HeaderCell>{t('payment.records.amount')}</Table.HeaderCell>
                <Table.HeaderCell>{t('payment.records.quota')}</Table.HeaderCell>
                <Table.HeaderCell>{t('payment.records.method')}</Table.HeaderCell>
                <Table.HeaderCell>{t('payment.records.status')}</Table.HeaderCell>
                <Table.HeaderCell>{t('payment.records.time')}</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {payments.slice((activePage - 1) * ITEMS_PER_PAGE, activePage * ITEMS_PER_PAGE).map((p) => (
                <Table.Row key={p.id}>
                  <Table.Cell>{p.order_no}</Table.Cell>
                  <Table.Cell>¥{(p.amount / 100).toFixed(2)}</Table.Cell>
                  <Table.Cell>{renderQuota(p.quota, t)}</Table.Cell>
                  <Table.Cell><Label>{p.method}</Label></Table.Cell>
                  <Table.Cell>{renderStatus(p.status)}</Table.Cell>
                  <Table.Cell>{timestamp2string(p.created_time)}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
            <Table.Footer>
              <Table.Row>
                <Table.HeaderCell colSpan='6'>
                  <Pagination
                    floated='right'
                    activePage={activePage}
                    onPageChange={onPaginationChange}
                    size='small'
                    siblingRange={1}
                    totalPages={Math.ceil(payments.length / ITEMS_PER_PAGE) + (payments.length % ITEMS_PER_PAGE === 0 ? 1 : 0)}
                  />
                  <Button size='small' onClick={() => loadPayments(0)} loading={loading}>
                    {t('payment.records.refresh')}
                  </Button>
                </Table.HeaderCell>
              </Table.Row>
            </Table.Footer>
          </Table>
        </Card.Content>
      </Card>
    </div>
  );
};

export default PaymentRecords;