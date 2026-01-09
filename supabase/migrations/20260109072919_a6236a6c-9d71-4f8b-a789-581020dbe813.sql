-- Ajustar sequence para começar após o maior os_number existente
SELECT setval('service_orders_os_number_seq', 
  (SELECT COALESCE(MAX(os_number), 0) + 1 FROM service_orders), 
  false
);