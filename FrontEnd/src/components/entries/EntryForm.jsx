/**
 * Reusable form for creating and editing entries.
 * Receives a form instance from the parent via props to allow
 * the parent to programmatically read and set values (e.g. for edit mode).
 */

import { Form, Input, Select, DatePicker } from 'antd';
import { useTranslation } from 'react-i18next';
import CostInput from '../core/controls/CostInput';

const EntryForm = ({ form }) => {
  const { t } = useTranslation();

  return (
    <Form form={form} layout="vertical">
      <Form.Item name="date" label={t('common.date')} rules={[{ required: true }]}>
        <DatePicker className="w-full" />
      </Form.Item>
      <Form.Item name="type" label={t('common.type')} rules={[{ required: true }]}>
        <Select>
          <Select.Option value="income">{t('common.income')}</Select.Option>
          <Select.Option value="expense">{t('common.expense')}</Select.Option>
        </Select>
      </Form.Item>
      <Form.Item name="description" label={t('common.description')} rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item name="amount" label={t('common.amount')} rules={[{ required: true }]}>
        <CostInput className="w-full" />
      </Form.Item>
    </Form>
  );
};

export default EntryForm;
