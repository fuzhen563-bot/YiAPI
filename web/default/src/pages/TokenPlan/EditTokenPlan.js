import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Form, Card } from 'semantic-ui-react';
import { useParams, useNavigate } from 'react-router-dom';
import { API, showError, showSuccess } from '../../helpers';
import { renderQuotaWithPrompt } from '../../helpers/render';

const EditTokenPlan = () => {
  const { t } = useTranslation();
  const params = useParams();
  const navigate = useNavigate();
  const planId = params.id;
  const isEdit = planId !== undefined;
  const [loading, setLoading] = useState(isEdit);
  const originInputs = {
    name: '',
    description: '',
    quota: 100000,
    price: 100,
    duration_days: 30,
  };
  const [inputs, setInputs] = useState(originInputs);
  const { name, description, quota, price, duration_days } = inputs;

  const handleCancel = () => {
    navigate('/plan');
  };

  const handleInputChange = (e, { name, value }) => {
    setInputs((inputs) => ({ ...inputs, [name]: value }));
  };

  const loadPlan = async () => {
    let res = await API.get(`/api/plan/${planId}`);
    const { success, message, data } = res.data;
    if (success) {
      setInputs(data);
    } else {
      showError(message);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isEdit) {
      loadPlan().then();
    }
  }, []);

  const submit = async () => {
    if (!isEdit && inputs.name === '') return;
    let localInputs = {
      ...inputs,
      quota: parseInt(inputs.quota),
      price: parseInt(inputs.price),
      duration_days: parseInt(inputs.duration_days),
    };
    let res;
    if (isEdit) {
      res = await API.put(`/api/plan/`, {
        ...localInputs,
        id: parseInt(planId),
      });
    } else {
      res = await API.post(`/api/plan/`, localInputs);
    }
    const { success, message } = res.data;
    if (success) {
      if (isEdit) {
        showSuccess(t('token_plan.messages.update_success'));
      } else {
        showSuccess(t('token_plan.messages.create_success'));
        setInputs(originInputs);
      }
    } else {
      showError(message);
    }
  };

  return (
    <div className='dashboard-container'>
      <Card fluid className='chart-card'>
        <Card.Content>
          <Card.Header className='header'>
            {isEdit ? t('token_plan.edit.title_edit') : t('token_plan.edit.title_create')}
          </Card.Header>
          <Form loading={loading} autoComplete='new-password'>
            <Form.Field>
              <Form.Input
                label={t('token_plan.edit.name')}
                name='name'
                placeholder={t('token_plan.edit.name_placeholder')}
                onChange={handleInputChange}
                value={name}
                autoComplete='new-password'
                required
              />
            </Form.Field>
            <Form.Field>
              <Form.Input
                label={t('token_plan.edit.description')}
                name='description'
                placeholder={t('token_plan.edit.description_placeholder')}
                onChange={handleInputChange}
                value={description}
                autoComplete='new-password'
              />
            </Form.Field>
            <Form.Field>
              <Form.Input
                label={`${t('token_plan.edit.quota')}${renderQuotaWithPrompt(quota, t)}`}
                name='quota'
                placeholder={t('token_plan.edit.quota_placeholder')}
                onChange={handleInputChange}
                value={quota}
                autoComplete='new-password'
                type='number'
              />
            </Form.Field>
            <Form.Field>
              <Form.Input
                label={t('token_plan.edit.price')}
                name='price'
                placeholder={t('token_plan.edit.price_placeholder')}
                onChange={handleInputChange}
                value={price}
                autoComplete='new-password'
                type='number'
              />
            </Form.Field>
            <Form.Field>
              <Form.Input
                label={t('token_plan.edit.duration')}
                name='duration_days'
                placeholder={t('token_plan.edit.duration_placeholder')}
                onChange={handleInputChange}
                value={duration_days}
                autoComplete='new-password'
                type='number'
              />
            </Form.Field>
            <Button positive onClick={submit}>
              {t('token_plan.edit.buttons.submit')}
            </Button>
            <Button onClick={handleCancel}>
              {t('token_plan.edit.buttons.cancel')}
            </Button>
          </Form>
        </Card.Content>
      </Card>
    </div>
  );
};

export default EditTokenPlan;