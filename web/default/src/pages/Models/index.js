import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card,
  Icon,
  Input,
  Label,
  Button,
  Modal,
  List,
  Segment,
} from 'semantic-ui-react';
import { API, showError } from '../../helpers';

const Models = () => {
  const { t } = useTranslation();
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedModel, setSelectedModel] = useState(null);

  const loadModels = useCallback(async () => {
    try {
      const res = await API.get('/api/models');
      if (res.data.success) {
        const data = res.data.data;
        setModels(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      showError(t('models.load_failed'));
    }
    setLoading(false);
  }, [t]);

  useEffect(() => {
    loadModels().then();
  }, [loadModels]);

  const filtered = Array.isArray(models) ? models.filter((m) =>
    m.id?.toLowerCase().includes(search.toLowerCase())
  ) : [];

  const grouped = {};
  filtered.forEach((m) => {
    const prefix = m.id?.split('-')[0] || 'other';
    if (!grouped[prefix]) grouped[prefix] = [];
    grouped[prefix].push(m);
  });

  return (
    <div className='dashboard-container'>
      {/* Model detail modal */}
      <Modal
        open={!!selectedModel}
        onClose={() => setSelectedModel(null)}
        size='small'
      >
        {selectedModel && (
          <>
            <Modal.Header>
              <Icon name='cube' />
              {selectedModel.id}
            </Modal.Header>
            <Modal.Content>
              <Segment basic>
                <List relaxed divided>
                  <List.Item>
                    <List.Header>{t('models.detail.object')}</List.Header>
                    <List.Description>{selectedModel.object || 'model'}</List.Description>
                  </List.Item>
                  <List.Item>
                    <List.Header>{t('models.detail.created')}</List.Header>
                    <List.Description>{selectedModel.created || '-'}</List.Description>
                  </List.Item>
                  <List.Item>
                    <List.Header>{t('models.detail.owned_by')}</List.Header>
                    <List.Description>{selectedModel.owned_by || 'system'}</List.Description>
                  </List.Item>
                </List>
              </Segment>
            </Modal.Content>
            <Modal.Actions>
              <Button onClick={() => setSelectedModel(null)}>
                {t('models.detail.close')}
              </Button>
            </Modal.Actions>
          </>
        )}
      </Modal>

      <Card fluid className='chart-card'>
        <Card.Content>
          <Card.Header className='header'>
            <Icon name='grid layout' />
            {t('models.title')}
          </Card.Header>

          <div style={{ marginBottom: '1em' }}>
            <Input
              icon='search'
              fluid
              iconPosition='left'
              placeholder={t('models.search')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '2em' }}>
              <Icon name='spinner' loading size='large' />
            </div>
          ) : Object.keys(grouped).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2em', color: '#888' }}>
              <Icon name='cube' size='large' />
              <p>{t('models.empty')}</p>
            </div>
          ) : (
            Object.entries(grouped).map(([group, items]) => (
              <div key={group} style={{ marginBottom: '1.5em' }}>
                <Label color='blue' ribbon style={{ marginBottom: '0.5em' }}>
                  {group.toUpperCase()}
                  <Label.Detail>{items.length}</Label.Detail>
                </Label>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '6px',
                    marginTop: '0.5em',
                  }}
                >
                  {items.map((m) => (
                    <Label
                      key={m.id}
                      as='a'
                      basic
                      onClick={() => setSelectedModel(m)}
                      style={{
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = 'translateY(-1px)';
                        e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = '';
                        e.target.style.boxShadow = '';
                      }}
                    >
                      {m.id}
                    </Label>
                  ))}
                </div>
              </div>
            ))
          )}
        </Card.Content>
      </Card>
    </div>
  );
};

export default Models;