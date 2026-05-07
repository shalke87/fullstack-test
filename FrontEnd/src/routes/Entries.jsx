/**
 * Entries page - displays a list of income/expense entries for the authenticated user.
 *
 * Two separate form instances are used (form and editForm) to keep add and edit
 * state isolated - this avoids conflicts when opening the edit modal while the
 * add modal has unsaved data.
 *
 * date values are converted to ISO 8601 strings before sending to the API
 * because the backend schema expects format: 'date-time'.
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Form, Modal, Button } from 'antd';
import dayjs from 'dayjs';
import Table from '../components/core/table/Table';
import EntryForm from '../components/entries/EntryForm';
import Api from '../helpers/core/Api';

import ContentPanel from '../components/core/layout/ContentPanel';

const Entries = () => {
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();
  const [entries, setEntries] = useState([]);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [editingEntry, setEditingEntry] = useState(null);
  const [nextKey, setNextKey] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  const fetchEntries = async (next = null) => {
    setLoading(true);
    try {
      const params = { limit: 20, sorter: '-createdAt' };
      if (next) params.nextKey = next;
      const res = await Api.get('/entries', { params });
      const newNextKey = res.headers['x-next-key'];
      setEntries(prev => (next ? [...prev, ...res.data] : res.data));
      setNextKey(newNextKey);
      setHasMore(res.data.length === 20 && newNextKey !== 'null');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const columns = [
    {
      title: t('common.date'),
      dataIndex: 'date',
      key: 'date',
      render: date => dayjs(date).format('DD/MM/YYYY')
    },
    {
      title: t('common.type'),
      dataIndex: 'type',
      key: 'type'
    },
    {
      title: t('common.description'),
      dataIndex: 'description',
      key: 'description'
    },
    {
      title: t('common.amount'),
      dataIndex: 'amount',
      key: 'amount'
    }
  ];

  const handleAdd = async () => {
    const values = await form.validateFields();
    const formattedValues = {
      ...values,
      date: values.date.toISOString()
    };
    await Api.post('/entries', formattedValues);
    form.resetFields();
    await fetchEntries();
  };

  const handleDelete = async record => {
    await Api.delete(`/entries/${record._id}`);
    await fetchEntries();
  };

  const handleEdit = async record => {
    editForm.setFieldsValue({
      ...record,
      date: dayjs(record.date)
    });
    setEditingEntry(record);
  };

  const handleUpdate = async () => {
    const values = await editForm.validateFields();
    const formattedValues = {
      ...values,
      date: values.date.toISOString()
    };
    await Api.patch(`/entries/${editingEntry._id}`, formattedValues);
    setEditingEntry(null);
    await fetchEntries();
  };

  return (
    <ContentPanel title={t('common.entries')} loading={loading}>
      <Table
        rowKey="_id"
        columns={columns}
        dataSource={entries}
        pagination={false}
        addForm={{
          title: t('common.newEntry'),
          template: <EntryForm form={form} />,
          onSave: handleAdd,
          closeAfterSave: true,
          destroyOnClose: true
        }}
        deleteSaveButtonOnRow
        onDelete={handleDelete}
        editCancelButtonOnRow
        onEdit={handleEdit}
        infinite={
          hasMore
            ? {
                next: () => fetchEntries(nextKey),
                hasMore,
                dataLength: entries.length,
                scrollableTarget: 'scrollableDiv'
              }
            : false
        }
      />
      <Modal
        title={t('common.editEntry')}
        open={!!editingEntry}
        onCancel={() => {
          setEditingEntry(null);
          editForm.resetFields();
        }}
        footer={[
          <Button key="submit" type="primary" onClick={handleUpdate}>
            {t('common.save')}
          </Button>
        ]}
        destroyOnClose
      >
        <EntryForm form={editForm} />
      </Modal>
    </ContentPanel>
  );
};

export default Entries;
