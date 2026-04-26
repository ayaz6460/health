export interface Project {
  id: string;
  name: string;
  base_url: string;
  description: string | null;
  admin_email: string | null;
  public_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface Endpoint {
  id: string;
  project_id: string;
  name: string;
  path: string;
  method: string;
  expected_status: number;
  keyword_check: string | null;
  check_interval_seconds: number;
  is_active: boolean;
  created_at: string;
}

export interface HealthLog {
  id: string;
  endpoint_id: string;
  status: 'UP' | 'DOWN';
  response_time: number | null;
  status_code: number | null;
  error_message: string | null;
  checked_at: string;
}

export interface Incident {
  id: string;
  endpoint_id: string;
  started_at: string;
  resolved_at: string | null;
  duration_seconds: number | null;
  notified_admin: boolean;
  notified_users: boolean;
  is_resolved: boolean;
}

export interface SmtpConfig {
  id: string;
  project_id: string;
  host: string;
  port: number;
  email: string;
  password_encrypted: string;
  from_name: string;
  created_at: string;
}

export interface Subscriber {
  id: string;
  project_id: string;
  email: string;
  subscribed_at: string;
  is_active: boolean;
}

export interface EndpointWithProject extends Endpoint {
  health_projects: Project;
}

export interface IncidentWithEndpoint extends Incident {
  health_endpoints: Endpoint & { health_projects: Project };
}
