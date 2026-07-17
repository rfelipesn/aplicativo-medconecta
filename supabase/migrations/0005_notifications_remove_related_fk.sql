-- notifications.related_demand_id: remove FK constraint to demands(id)
-- Rationale: a coluna é usada como referência polimórfica (demanda, receita,
-- documento, paciente para chat). Manter FK para demands(id) quebra inserts
-- legítimos dos outros tipos. A coluna continua sendo UUID opcional.

ALTER TABLE notifications
  DROP CONSTRAINT IF EXISTS notifications_related_demand_id_fkey;
