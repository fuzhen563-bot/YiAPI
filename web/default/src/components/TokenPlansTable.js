import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Form,
  Label,
  Popup,
  Pagination,
  Table,
} from 'semantic-ui-react';
import { Link } from 'react-router-dom';
import { API, showError, showSuccess, timestamp2string } from '../helpers';
import { ITEMS_PER_PAGE } from '../constants';
import { renderQuota } from '../helpers/render';

function renderStatus(status, t) {
  switch (status) {
    case 1:
      return (
        <Label basic color='green'>
          {t('token_plan.status.enabled')}
        </Label>
      );
    case 2:
      return (
        <Label basic color='red'>
          {t('token_plan.status.disabled')}
        </Label>
      );
    default:
      return (
        <Label basic color='black'>
          {t('token_plan.status.unknown')}
        </Label>
      );
  }
}

const TokenPlansTable = () => {
  const { t } = useTranslation();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState(1);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searching, setSearching] = useState(false);

  const loadPlans = async (startIdx) => {
    const res = await API.get(`/api/plan/all?p=${startIdx}`);
    const { success, message, data } = res.data;
    if (success) {
      if (startIdx === 0) {
        setPlans(data);
      } else {
        let newPlans = plans;
        newPlans.push(...data);
        setPlans(newPlans);
      }
    } else {
      showError(message);
    }
    setLoading(false);
  };

  const onPaginationChange = (e, { activePage }) => {
    (async () => {
      if (activePage === Math.ceil(plans.length / ITEMS_PER_PAGE) + 1) {
        await loadPlans(activePage - 1);
      }
      setActivePage(activePage);
    })();
  };

  useEffect(() => {
    loadPlans(0).then().catch((reason) => {
      showError(reason);
    });
  }, []);

  const managePlan = async (id, action, idx) => {
    let data = { id };
    let res;
    switch (action) {
      case 'delete':
        res = await API.delete(`/api/plan/${id}`);
        break;
      case 'enable':
        data.status = 1;
        res = await API.put('/api/plan/', data);
        break;
      case 'disable':
        data.status = 2;
        res = await API.put('/api/plan/', data);
        break;
    }
    const { success, message } = res.data;
    if (success) {
      showSuccess(t('token_plan.messages.operation_success'));
      let newPlans = [...plans];
      let realIdx = (activePage - 1) * ITEMS_PER_PAGE + idx;
      if (action === 'delete') {
        newPlans[realIdx].deleted = true;
      } else {
        newPlans[realIdx].status = data.status;
      }
      setPlans(newPlans);
    } else {
      showError(message);
    }
  };

  const searchPlans = async () => {
    if (searchKeyword === '') {
      await loadPlans(0);
      setActivePage(1);
      return;
    }
    setSearching(true);
    const res = await API.get(`/api/plan/search?keyword=${searchKeyword}`);
    const { success, message, data } = res.data;
    if (success) {
      setPlans(data);
      setActivePage(1);
    } else {
      showError(message);
    }
    setSearching(false);
  };

  const handleKeywordChange = async (e, { value }) => {
    setSearchKeyword(value.trim());
  };

  const sortPlan = (key) => {
    if (plans.length === 0) return;
    setLoading(true);
    let sortedPlans = [...plans];
    sortedPlans.sort((a, b) => {
      if (!isNaN(a[key])) {
        return a[key] - b[key];
      } else {
        return ('' + a[key]).localeCompare(b[key]);
      }
    });
    if (sortedPlans[0].id === plans[0].id) {
      sortedPlans.reverse();
    }
    setPlans(sortedPlans);
    setLoading(false);
  };

  const refresh = async () => {
    setLoading(true);
    await loadPlans(0);
    setActivePage(1);
  };

  return (
    <>
      <Form onSubmit={searchPlans}>
        <Form.Input
          icon='search'
          fluid
          iconPosition='left'
          placeholder={t('token_plan.search')}
          value={searchKeyword}
          loading={searching}
          onChange={handleKeywordChange}
        />
      </Form>

      <Table basic={'very'} compact size='small'>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell style={{ cursor: 'pointer' }} onClick={() => sortPlan('id')}>
              {t('token_plan.table.id')}
            </Table.HeaderCell>
            <Table.HeaderCell style={{ cursor: 'pointer' }} onClick={() => sortPlan('name')}>
              {t('token_plan.table.name')}
            </Table.HeaderCell>
            <Table.HeaderCell style={{ cursor: 'pointer' }} onClick={() => sortPlan('status')}>
              {t('token_plan.table.status')}
            </Table.HeaderCell>
            <Table.HeaderCell style={{ cursor: 'pointer' }} onClick={() => sortPlan('quota')}>
              {t('token_plan.table.quota')}
            </Table.HeaderCell>
            <Table.HeaderCell style={{ cursor: 'pointer' }} onClick={() => sortPlan('price')}>
              {t('token_plan.table.price')}
            </Table.HeaderCell>
            <Table.HeaderCell style={{ cursor: 'pointer' }} onClick={() => sortPlan('duration_days')}>
              {t('token_plan.table.duration')}
            </Table.HeaderCell>
            <Table.HeaderCell style={{ cursor: 'pointer' }} onClick={() => sortPlan('created_time')}>
              {t('token_plan.table.created_time')}
            </Table.HeaderCell>
            <Table.HeaderCell>{t('token_plan.table.actions')}</Table.HeaderCell>
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {plans
            .slice((activePage - 1) * ITEMS_PER_PAGE, activePage * ITEMS_PER_PAGE)
            .map((plan, idx) => {
              if (plan.deleted) return <></>;
              return (
                <Table.Row key={plan.id}>
                  <Table.Cell>{plan.id}</Table.Cell>
                  <Table.Cell>{plan.name}</Table.Cell>
                  <Table.Cell>{renderStatus(plan.status, t)}</Table.Cell>
                  <Table.Cell>{renderQuota(plan.quota, t)}</Table.Cell>
                  <Table.Cell>¥{(plan.price / 100).toFixed(2)}</Table.Cell>
                  <Table.Cell>{plan.duration_days > 0 ? `${plan.duration_days} ${t('token_plan.days')}` : t('token_plan.unlimited')}</Table.Cell>
                  <Table.Cell>{timestamp2string(plan.created_time)}</Table.Cell>
                  <Table.Cell>
                    <div>
                      <Popup
                        trigger={
                          <Button size='tiny' negative>
                            {t('token_plan.buttons.delete')}
                          </Button>
                        }
                        on='click'
                        flowing
                        hoverable
                      >
                        <Button negative onClick={() => managePlan(plan.id, 'delete', idx)}>
                          {t('token_plan.buttons.confirm_delete')}
                        </Button>
                      </Popup>
                      <Button
                        size={'tiny'}
                        onClick={() => managePlan(plan.id, plan.status === 1 ? 'disable' : 'enable', idx)}
                      >
                        {plan.status === 1 ? t('token_plan.buttons.disable') : t('token_plan.buttons.enable')}
                      </Button>
                      <Button size={'tiny'} as={Link} to={'/plan/edit/' + plan.id}>
                        {t('token_plan.buttons.edit')}
                      </Button>
                    </div>
                  </Table.Cell>
                </Table.Row>
              );
            })}
        </Table.Body>

        <Table.Footer>
          <Table.Row>
            <Table.HeaderCell colSpan='8'>
              <Button size='small' as={Link} to='/plan/add' loading={loading}>
                {t('token_plan.buttons.add')}
              </Button>
              <Button size='small' onClick={refresh} loading={loading}>
                {t('token_plan.buttons.refresh')}
              </Button>
              <Pagination
                floated='right'
                activePage={activePage}
                onPageChange={onPaginationChange}
                size='small'
                siblingRange={1}
                totalPages={
                  Math.ceil(plans.length / ITEMS_PER_PAGE) +
                  (plans.length % ITEMS_PER_PAGE === 0 ? 1 : 0)
                }
              />
            </Table.HeaderCell>
          </Table.Row>
        </Table.Footer>
      </Table>
    </>
  );
};

export default TokenPlansTable;