import { useState } from 'react';
import { CalendarOutlined, CheckCircleFilled, MailOutlined, PlusOutlined, TeamOutlined } from '@ant-design/icons';
import { Avatar, Button, Card, Col, ConfigProvider, Form, Input, Layout, Menu, Progress, Row, Space, Statistic, Table, Tag, Typography } from 'antd';
import type { TableProps } from 'antd';
import './PanelPage.css';

const { Header, Content, Sider } = Layout;
const { Title, Text } = Typography;
const eventColumns: TableProps<{ key: string; name: string; date: string; guests: string; status: string }>['columns'] = [
  { title: 'Evento', dataIndex: 'name', key: 'name', render: (value) => <Text strong>{value}</Text> },
  { title: 'Fecha', dataIndex: 'date', key: 'date' },
  { title: 'Confirmados', dataIndex: 'guests', key: 'guests' },
  { title: 'Estado', dataIndex: 'status', key: 'status', render: (value) => <Tag color={value === 'Publicado' ? 'success' : 'gold'}>{value}</Tag> },
];
const events = [{ key: '1', name: 'Boda de Ana & Diego', date: '12 oct. 2026', guests: '86 / 120', status: 'Publicado' }, { key: '2', name: 'XV años de Sofía', date: '22 nov. 2026', guests: '—', status: 'Borrador' }];

function AccessScreen() {
  const [sent, setSent] = useState(false); const [form] = Form.useForm(); const email = Form.useWatch('email', form);
  return <main className="panel-access"><Card className="panel-access-card" bordered={false}><div className="panel-mark">N</div><Title level={2}>{sent ? 'Revisa tu correo' : 'Accede a tu panel'}</Title>{sent ? <><Text>Enviamos un enlace de acceso a <strong>{email}</strong>. No necesitas contraseña.</Text><Button type="link" onClick={() => setSent(false)}>Usar otro correo</Button></> : <><Text type="secondary">Ingresa el correo con el que se registró tu cuenta.</Text><Form form={form} layout="vertical" onFinish={() => setSent(true)}><Form.Item label="Correo electrónico" name="email" rules={[{ required: true, type: 'email', message: 'Escribe un correo válido.' }]}><Input size="large" prefix={<MailOutlined />} placeholder="tu@correo.com" autoComplete="email" /></Form.Item><Button htmlType="submit" type="primary" size="large" block>Enviar enlace de acceso</Button></Form><Text className="panel-access-note" type="secondary">Acceso protegido y sin contraseñas.</Text></>}</Card></main>;
}

function Dashboard() {
  return <Layout className="panel-shell"><Sider breakpoint="lg" collapsedWidth="0" width={244} className="panel-sider"><div className="panel-logo"><span>N</span> Nupia</div><div className="panel-workspace"><Avatar size={32}>AD</Avatar><div><Text strong>Ana & Diego</Text><Text type="secondary">Plan Premium</Text></div></div><Menu theme="dark" mode="inline" defaultSelectedKeys={['overview']} items={[{ key: 'overview', label: 'Resumen' }, { key: 'events', label: 'Eventos' }, { key: 'guests', label: 'Invitados' }, { key: 'design', label: 'Plantillas y temas' }, { key: 'billing', label: 'Plan y facturación' }, { key: 'settings', label: 'Configuración' }]} /></Sider><Layout><Header className="panel-header"><div><Title level={3}>Buenos días, Ana</Title><Text type="secondary">Aquí está lo que ocurre en tus eventos.</Text></div><Space><Avatar>AD</Avatar></Space></Header><Content className="panel-content"><div className="panel-content-top"><div><Title level={2}>Resumen</Title><Text type="secondary">Gestiona cada detalle de tus celebraciones.</Text></div><Button type="primary" icon={<PlusOutlined />} size="large">Crear evento</Button></div><Row gutter={[20, 20]}><Col xs={24} sm={12} xl={6}><Card><Statistic title="Eventos activos" value={2} prefix={<CalendarOutlined />} /></Card></Col><Col xs={24} sm={12} xl={6}><Card><Statistic title="Invitados" value={120} prefix={<TeamOutlined />} /></Card></Col><Col xs={24} sm={12} xl={6}><Card><Statistic title="Confirmados" value={86} suffix="/ 120" /></Card></Col><Col xs={24} sm={12} xl={6}><Card><Statistic title="Confirmación" value={72} suffix="%" prefix={<CheckCircleFilled />} /></Card></Col></Row><Row gutter={[20, 20]} className="panel-row"><Col xs={24} xl={15}><Card title="Tus eventos"><Table columns={eventColumns} dataSource={events} pagination={false} /></Card></Col><Col xs={24} xl={9}><Card title="Boda de Ana & Diego" extra={<Tag color="success">Publicado</Tag>}><Text type="secondary">12 de octubre de 2026</Text><div className="panel-progress"><div><Text strong>Respuestas RSVP</Text><Text type="secondary">86 confirmados de 120</Text></div><Progress percent={72} showInfo={false} strokeColor="#7e4650" /></div><Button block>Ver invitación</Button></Card></Col></Row></Content></Layout></Layout>;
}

export function PanelPage() { const isAuthenticated = new URLSearchParams(window.location.search).get('preview') === 'true'; return <ConfigProvider theme={{ token: { colorPrimary: '#7e4650', borderRadius: 8, fontFamily: 'DM Sans, sans-serif' } }}>{isAuthenticated ? <Dashboard /> : <AccessScreen />}</ConfigProvider>; }
