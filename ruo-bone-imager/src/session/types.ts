export type Modality =
  | 'us_bone_interface'
  | 'us_qus'
  | 'mw_radar'
  | 'hybrid';

export type Laterality = 'L' | 'R' | 'NA';

export type ReferenceImaging =
  | 'none'
  | 'xray_pending'
  | 'xray_available_not_linked';

export type SessionMeta = {
  session_id: string;
  protocol_id: string;
  dual_mod_id?: string;
  modality: Modality;
  anatomical_site: string;
  laterality: Laterality;
  subject_id: string;
  operator_id: string;
  acoustic_or_rf_budget_id: string;
  reference_imaging: ReferenceImaging;
  consent_flag: boolean;
  phantom_serial?: string;
  created_at: string;
  software_version: string;
  banner_version: string;
};

export type QcForm = {
  coupling_ok: boolean | null;
  landmark_visible: boolean | null;
  motion_acceptable: boolean | null;
  cortical_line_qc: 'good' | 'fair' | 'poor' | null;
  notes: string;
};

export type FrameStub = {
  frame_id: string;
  index: number;
  path: string;
  width_px: number;
  height_px: number;
  mm_per_px: number;
};

export type AnnotationTag =
  | 'step-off'
  | 'possible_gap'
  | 'uncertain'
  | 'artifact_suspected';

export type PointPx = {
  x: number;
  y: number;
};

export type CorticalPolyline = {
  id: string;
  kind: 'cortical_polyline';
  points: PointPx[];
  annotator_id: string;
  created_at: string;
  source_modality: Modality;
  source: 'human';
  tag?: AnnotationTag;
};

export type GapCaliper = {
  id: string;
  kind: 'gap_caliper';
  a: PointPx;
  b: PointPx;
  width_mm: number;
  annotator_id: string;
  created_at: string;
  source_modality: Modality;
  source: 'human';
  tag: AnnotationTag;
  gap_id?: string;
};

export type Annotation = CorticalPolyline | GapCaliper;

export type AnnotationsDoc = {
  schema_version: string;
  session_id: string;
  frame_id: string;
  mm_per_px: number;
  annotations: Annotation[];
};

export type ResearchSession = {
  meta: SessionMeta;
  frames: FrameStub[];
  current_frame_index: number;
  annotations_by_frame: Record<string, Annotation[]>;
  qc: QcForm;
  ruo_acknowledged: boolean;
};
