-- =============================================================================
-- ==             ملف تهيئة البيانات الأساسية لـ TriPro HR                   ==
-- ==             ينفذ هذا الملف في SQL Editor الخاص بـ Supabase                ==
-- =============================================================================

-- معرف الشركة الرئيسي للموظفين الحاليين
-- هذا المعرف يربط الموظفين بالفروع والأقسام والورديات بشكل سليم
DO $$
DECLARE
  org_id_var UUID := '2ab9276c-4d29-425e-b20f-640a901e9104';
BEGIN

  -- 1. إضافة الأقسام الأساسية (Departments)
  INSERT INTO departments (id, name, budget, org_id) VALUES
    ('26e6fa5a-c0de-4193-8f47-d33711bb6ce5', 'الموارد البشرية', 150000, org_id_var),
    ('5ccb0556-a83a-405f-bf89-664b6ea79207', 'التطوير والبرمجة', 450000, org_id_var),
    ('be66a5b0-622a-4f08-809b-a88d5dd549cd', 'المبيعات والتسويق', 300000, org_id_var),
    ('2db50320-5f0d-43ab-a36a-8167865e8057', 'الخدمات المساندة', 120000, org_id_var),
    ('efa5c26a-9534-4297-bfad-b5dcdc182e1a', 'الحسابات والمالية', 200000, org_id_var),
    ('7970c33d-1aad-4a96-8619-824efbd1a2a9', 'الأمن والحراسة', 100000, org_id_var),
    ('e8e1278f-dbca-449e-801a-07e75193dfd7', 'إدارة العمليات', 250000, org_id_var),
    ('ebb72920-a467-4234-8a11-9fca67f3282c', 'الدعم الفني', 180000, org_id_var)
  ON CONFLICT (id) DO UPDATE 
  SET name = EXCLUDED.name, budget = EXCLUDED.budget, org_id = EXCLUDED.org_id;

  -- 2. إضافة الفروع الجغرافية (Branches)
  INSERT INTO branches (id, name, location, wifi_config, org_id) VALUES
    ('34ce3b97-f960-4814-8e7e-8cba5f009ab1', 'الفرع الرئيسي - القاهرة', 
     '{"address": "شارع التسعين، التجمع الخامس، القاهرة", "radius": 150, "geofencingEnabled": true, "lat": 30.0254, "lng": 31.4789}'::jsonb, 
     '{"ssid": "TriPro-HQ-WiFi"}'::jsonb, org_id_var),
     
    ('04acaa93-3cc9-4709-8ea1-e8f582e98dc0', 'فرع الإسكندرية', 
     '{"address": "طريق الجيش، جليم، الإسكندرية", "radius": 100, "geofencingEnabled": true, "lat": 31.2456, "lng": 29.9654}'::jsonb, 
     '{"ssid": "TriPro-Alex-WiFi"}'::jsonb, org_id_var),
     
    ('73cd41fd-1a25-48ed-8875-1f47e3ebafbf', 'فرع الجيزة - الدقي', 
     '{"address": "شارع التحرير، الدقي، الجيزة", "radius": 120, "geofencingEnabled": true, "lat": 30.0389, "lng": 31.2111}'::jsonb, 
     '{"ssid": "TriPro-Giza-WiFi"}'::jsonb, org_id_var),
     
    ('6fafba9d-2227-4a82-a819-443787af06fc', 'فرع طنطا', 
     '{"address": "شارع البحر، طنطا", "radius": 100, "geofencingEnabled": true, "lat": 30.7889, "lng": 30.9989}'::jsonb, 
     '{"ssid": "TriPro-Tanta-WiFi"}'::jsonb, org_id_var),
     
    ('2cf3b463-1df2-4d04-8ea6-9e0d99f95f25', 'فرع أسيوط', 
     '{"address": "شارع الجمهورية، أسيوط", "radius": 100, "geofencingEnabled": true, "lat": 27.1809, "lng": 31.1837}'::jsonb, 
     '{"ssid": "TriPro-Asyut-WiFi"}'::jsonb, org_id_var),
     
    ('6057ecc1-fc61-44a7-9bea-234ae403c083', 'فرع المنصورة', 
     '{"address": "شارع المشاية السفلية، المنصورة", "radius": 100, "geofencingEnabled": true, "lat": 31.0425, "lng": 31.3578}'::jsonb, 
     '{"ssid": "TriPro-Mans-WiFi"}'::jsonb, org_id_var),
     
    ('0991687a-7348-4794-a1a1-8c2a9ff6f5b9', 'فرع الغردقة', 
     '{"address": "الممشى السياحي، الغردقة", "radius": 200, "geofencingEnabled": false, "lat": 27.2579, "lng": 33.8116}'::jsonb, 
     '{"ssid": "TriPro-Hurghada-WiFi"}'::jsonb, org_id_var)
  ON CONFLICT (id) DO UPDATE 
  SET name = EXCLUDED.name, location = EXCLUDED.location, wifi_config = EXCLUDED.wifi_config, org_id = EXCLUDED.org_id;

  -- 3. إضافة الورديات (Shifts)
  INSERT INTO shifts (id, name, start_time, end_time, grace_period_minutes, is_overnight, type, settings, org_id) VALUES
    ('6794e705-4faf-4916-9360-e5d5b77cb387', 'الوردية الصباحية الثابتة', '09:00', '17:00', 15, false, 'FIXED', 
     '{"working_days": [1, 2, 3, 4, 7]}'::jsonb, org_id_var),
     
    ('86da8946-337b-4a91-9fee-6dd32b069e71', 'وردية المساء المتغيرة', '17:00', '01:00', 20, true, 'VARIABLE', 
     '{"working_days": [1, 2, 3, 4, 7]}'::jsonb, org_id_var),
     
    ('df3fb2a6-bce8-4d69-aace-339b4b7b744d', 'الوردية الليلية', '01:00', '09:00', 30, true, 'VARIABLE', 
     '{"working_days": [1, 2, 3, 4, 7]}'::jsonb, org_id_var)
  ON CONFLICT (id) DO UPDATE 
  SET name = EXCLUDED.name, start_time = EXCLUDED.start_time, end_time = EXCLUDED.end_time, 
      grace_period_minutes = EXCLUDED.grace_period_minutes, is_overnight = EXCLUDED.is_overnight, 
      type = EXCLUDED.type, settings = EXCLUDED.settings, org_id = EXCLUDED.org_id;

END $$;
