'use client';

import React, { useState } from 'react';
import {
  Card,
  Typography,
  List,
  Button,
  Select,
  InputNumber,
  ColorPicker,
  Modal,
  Form,
  Input,
  Divider,
  Tag,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useDashboardStore, ColorRule, DataSource } from '@/store/dashboardStore';

const { Title, Text } = Typography;
const { Option } = Select;

interface ColorRuleItemProps {
  rule: ColorRule;
  onUpdate: (rule: ColorRule) => void;
  onDelete: (ruleId: string) => void;
}

const ColorRuleItem: React.FC<ColorRuleItemProps> = ({ rule, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm] = Form.useForm();

  const handleEdit = () => {
    editForm.setFieldsValue(rule);
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      const values = await editForm.validateFields();
      onUpdate({ ...rule, ...values });
      setIsEditing(false);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    editForm.resetFields();
  };

  if (isEditing) {
    return (
      <Card size="small" className="mb-1 md:mb-2">
        <Form form={editForm} layout="vertical">
          <div className="grid grid-cols-2 gap-1 md:gap-2">
            <Form.Item name="operator" label="Operator" className="mb-1 md:mb-2">
              <Select size="small">
                <Option value="=">=</Option>
                <Option value="<">&lt;</Option>
                <Option value=">">&gt;</Option>
                <Option value="<=">&le;</Option>
                <Option value=">=">&ge;</Option>
              </Select>
            </Form.Item>
            <Form.Item name="value" label="Value" className="mb-1 md:mb-2">
              <InputNumber className="w-full" size="small" />
            </Form.Item>
          </div>
          <Form.Item name="color" label="Color" className="mb-1 md:mb-2">
            <ColorPicker
              showText
              format="hex"
              size="small"
              onChange={(color) => {
                editForm.setFieldValue('color', color.toHexString());
              }}
            />
          </Form.Item>
          <div className="flex gap-1 md:gap-2">
            <Button type="primary" size="small" onClick={handleSave} className="text-xs md:text-sm">
              Save
            </Button>
            <Button size="small" onClick={handleCancel} className="text-xs md:text-sm">
              Cancel
            </Button>
          </div>
        </Form>
      </Card>
    );
  }

  return (
    <Card size="small" className="mb-1 md:mb-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 md:gap-2">
          <div
            className="w-3 h-3 md:w-4 md:h-4 rounded"
            style={{ backgroundColor: rule.color }}
          />
          <Text className="text-xs md:text-sm">
            {rule.operator} {rule.value}
          </Text>
        </div>
        <div className="flex gap-1">
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={handleEdit}
          />
          <Popconfirm
            title="Delete this rule?"
            onConfirm={() => onDelete(rule.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
            />
          </Popconfirm>
        </div>
      </div>
    </Card>
  );
};

interface DataSourceCardProps {
  dataSource: DataSource;
  onUpdate: (updates: Partial<DataSource>) => void;
  isUsed: boolean;
}

const DataSourceCard: React.FC<DataSourceCardProps> = ({ dataSource, onUpdate, isUsed }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleAddRule = () => {
    const newRule: ColorRule = {
      id: `rule_${Date.now()}`,
      operator: '>=',
      value: 0,
      color: '#1890ff',
    };

    onUpdate({
      colorRules: [...dataSource.colorRules, newRule],
    });
  };

  const handleUpdateRule = (updatedRule: ColorRule) => {
    onUpdate({
      colorRules: dataSource.colorRules.map(rule =>
        rule.id === updatedRule.id ? updatedRule : rule
      ),
    });
  };

  const handleDeleteRule = (ruleId: string) => {
    onUpdate({
      colorRules: dataSource.colorRules.filter(rule => rule.id !== ruleId),
    });
  };

  return (
    <Card
      size="small"
      className="mb-2 md:mb-4"
      title={
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 md:gap-2">
            <Text strong className="text-xs md:text-sm">{dataSource.name}</Text>
            {isUsed && <Tag color="green" className="text-xs">In Use</Tag>}
          </div>
          <Button
            type="text"
            size="small"
            icon={<SettingOutlined />}
            onClick={() => setIsExpanded(!isExpanded)}
          />
        </div>
      }
    >
      <div className="space-y-1 md:space-y-2">
        <div>
          <Text type="secondary" className="text-xs md:text-sm">Field: </Text>
          <Text code className="text-xs md:text-sm">{dataSource.field}</Text>
        </div>

        {isExpanded && (
          <>
            <Divider className="my-2 md:my-3" />
            <div className="space-y-1 md:space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <Text strong className="text-xs md:text-sm">Color Rules</Text>
                <Button
                  type="dashed"
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={handleAddRule}
                  className="text-xs md:text-sm"
                >
                  Add Rule
                </Button>
              </div>

              {dataSource.colorRules.length === 0 ? (
                <Text type="secondary" className="text-xs md:text-sm">No color rules defined</Text>
              ) : (
                dataSource.colorRules.map(rule => (
                  <ColorRuleItem
                    key={rule.id}
                    rule={rule}
                    onUpdate={handleUpdateRule}
                    onDelete={handleDeleteRule}
                  />
                ))
              )}
            </div>
          </>
        )}
      </div>
    </Card>
  );
};

interface NewDataSourceModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (dataSource: Omit<DataSource, 'id'>) => void;
}

const NewDataSourceModal: React.FC<NewDataSourceModalProps> = ({ open, onClose, onSubmit }) => {
  const [form] = Form.useForm();

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const newDataSource: Omit<DataSource, 'id'> = {
        name: values.name,
        field: values.field,
        colorRules: [
          {
            id: 'default_1',
            operator: '<',
            value: 10,
            color: '#1890ff',
          },
          {
            id: 'default_2',
            operator: '>=',
            value: 10,
            color: '#52c41a',
          },
        ],
      };
      
      onSubmit(newDataSource);
      form.resetFields();
      onClose();
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  return (
    <Modal
      title="Add New Data Source"
      open={open}
      onOk={handleSubmit}
      onCancel={onClose}
      okText="Add Data Source"
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="name"
          label="Data Source Name"
          rules={[{ required: true, message: 'Please enter a name' }]}
        >
          <Input placeholder="e.g., Temperature, Humidity" />
        </Form.Item>
        <Form.Item
          name="field"
          label="API Field"
          rules={[{ required: true, message: 'Please select a field' }]}
          help="Available fields from Open-Meteo API"
        >
          <Select placeholder="Select API field">
            <Option value="temperature_2m">Temperature (2m)</Option>
            <Option value="relative_humidity_2m">Relative Humidity (2m)</Option>
            <Option value="precipitation">Precipitation</Option>
            <Option value="wind_speed_10m">Wind Speed (10m)</Option>
            <Option value="wind_direction_10m">Wind Direction (10m)</Option>
            <Option value="surface_pressure">Surface Pressure</Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export const Sidebar: React.FC = () => {
  const {
    dataSources,
    polygons,
    selectedPolygonId,
    updateDataSource,
    addDataSource,
    updatePolygon,
  } = useDashboardStore();

  const [showNewDataSourceModal, setShowNewDataSourceModal] = useState(false);

  const getDataSourceUsage = (dataSourceId: string): number => {
    return polygons.filter(p => p.dataSourceId === dataSourceId).length;
  };

  const handleUpdateDataSource = (id: string, updates: Partial<DataSource>) => {
    updateDataSource(id, updates);
  };

  const handleAddDataSource = (dataSource: Omit<DataSource, 'id'>) => {
    addDataSource(dataSource);
  };

  const selectedPolygon = selectedPolygonId 
    ? polygons.find(p => p.id === selectedPolygonId)
    : null;

  const handlePolygonDataSourceChange = (dataSourceId: string) => {
    if (selectedPolygonId) {
      updatePolygon(selectedPolygonId, { dataSourceId });
    }
  };

  return (
    <div className="h-full bg-gray-50 p-2 md:p-4 overflow-y-auto">
      <div className="space-y-4 md:space-y-6">
        {/* Data Sources Section */}
        <Card>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 md:mb-4 gap-2">
            <Title level={4} className="m-0 text-sm md:text-base">
              Data Sources
            </Title>
            <Button
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              onClick={() => setShowNewDataSourceModal(true)}
              className="text-xs md:text-sm"
            >
              Add Source
            </Button>
          </div>

          <div className="space-y-2">
            {dataSources.map(dataSource => (
              <DataSourceCard
                key={dataSource.id}
                dataSource={dataSource}
                onUpdate={(updates) => handleUpdateDataSource(dataSource.id, updates)}
                isUsed={getDataSourceUsage(dataSource.id) > 0}
              />
            ))}
          </div>
        </Card>

        {/* Selected Polygon Configuration */}
        {selectedPolygon && (
          <Card>
            <Title level={4} className="mb-3 md:mb-4 text-sm md:text-base">
              Polygon Configuration
            </Title>
            
            <div className="space-y-3 md:space-y-4">
              <div>
                <Text strong className="text-xs md:text-sm">Name: </Text>
                <Text className="text-xs md:text-sm">{selectedPolygon.name || 'Unnamed Polygon'}</Text>
              </div>

              <div>
                <Text strong className="block mb-2 text-xs md:text-sm">Data Source:</Text>
                <Select
                  value={selectedPolygon.dataSourceId}
                  onChange={handlePolygonDataSourceChange}
                  className="w-full"
                  size="small"
                >
                  {dataSources.map(ds => (
                    <Option key={ds.id} value={ds.id}>
                      {ds.name}
                    </Option>
                  ))}
                </Select>
              </div>

              <div>
                <Text strong className="text-xs md:text-sm">Points: </Text>
                <Text className="text-xs md:text-sm">{selectedPolygon.points.length}</Text>
              </div>

              <div>
                <Text strong className="text-xs md:text-sm">Centroid: </Text>
                <Text code className="text-xs">
                  {selectedPolygon.centroid[0].toFixed(4)}, {selectedPolygon.centroid[1].toFixed(4)}
                </Text>
              </div>
            </div>
          </Card>
        )}

        {/* Polygon List */}
        <Card>
          <Title level={4} className="mb-3 md:mb-4 text-sm md:text-base">
            Polygons ({polygons.length})
          </Title>
          
          {polygons.length === 0 ? (
            <Text type="secondary" className="text-xs md:text-sm">
              No polygons created yet. Draw polygons on the map to get started.
            </Text>
          ) : (
            <List
              size="small"
              dataSource={polygons}
              renderItem={(polygon) => {
                const dataSource = dataSources.find(ds => ds.id === polygon.dataSourceId);
                return (
                  <List.Item
                    className={`cursor-pointer rounded p-2 ${
                      selectedPolygonId === polygon.id ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => {
                      // This would be handled by the parent component
                    }}
                  >
                    <div className="w-full">
                      <div className="flex items-center justify-between">
                        <Text strong className="text-xs md:text-sm">
                          {polygon.name || 'Unnamed Polygon'}
                        </Text>
                        <div
                          className="w-3 h-3 md:w-4 md:h-4 rounded"
                          style={{ backgroundColor: polygon.color }}
                        />
                      </div>
                      <Text type="secondary" className="text-xs">
                        {dataSource?.name} • {polygon.points.length} points
                      </Text>
                    </div>
                  </List.Item>
                );
              }}
            />
          )}
        </Card>
      </div>

      <NewDataSourceModal
        open={showNewDataSourceModal}
        onClose={() => setShowNewDataSourceModal(false)}
        onSubmit={handleAddDataSource}
      />
    </div>
  );
};
