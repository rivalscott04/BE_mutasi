export const seed = async (db: any): Promise<void> => {
  await db.query(`
    INSERT IGNORE INTO \`users\` (\`id\`, \`email\`, \`password_hash\`, \`full_name\`, \`role\`, \`office_id\`, \`is_active\`, \`created_at\`, \`updated_at\`) VALUES
    ('c741a5e4-8882-4a01-b2c1-fb367f5c8fcc', 'admin.kanwil@kemenag.go.id', '$2b$10$SUX5YS5BRXQWbMR2yrWuG.wDyzPdEMNn71ecgq0dcDpr0IVf2IHhO', 'Admin Kanwil', 'admin', NULL, 1, NOW(), NOW()),
    ('7812dd3a-4e4f-4edc-b41e-4f9abc92189e', 'mataram@kemenag.go.id', '$2b$10$YQY6a.hFQUD83pIddVOm8umPHqa3Sy/SQ9TZXTfBpFfpHppudhpb6', 'Operator Mataram', 'operator', '11111111-1111-1111-1111-111111111111', 1, NOW(), NOW()),
    ('65a7bfb1-e97e-4af6-8c22-ff3dc7caa54c', 'lotim@kemenag.go.id', '$2b$10$iFR3CfmRGA566EieblZvKesddDeXWvUsV1RJo40B0cv7AkTz51KTy', 'Operator Lotim', 'operator', '22222222-2222-2222-2222-222222222222', 1, NOW(), NOW()),
    ('983b214f-82a3-404c-a2a5-79db18476ee3', 'loteng@kemenag.go.id', '$2b$10$Ab1TgRbvs..MgT4cJc4hOeZUWjJw/v6PvCWib7B3JJrV/ZmVKi7Jq', 'Operator Loteng', 'operator', '33333333-3333-3333-3333-333333333333', 1, NOW(), NOW()),
    ('aab821cc-2c18-4f4f-bad1-10190241f2e9', 'ksb@kemenag.go.id', '$2b$10$qmY8lE2sWyt2jtCck9bEG.ulnUcCxPPCCNIT8qlYNRL5NirXz8T2S', 'Operator KSB', 'operator', '44444444-4444-4444-4444-444444444444', 1, NOW(), NOW()),
    ('56b1a820-72e2-4173-b869-84dae82d07aa', 'klu@kemenag.go.id', '$2b$10$EYCxTwckifWFX9ZABtyT6ORCKadu4Nk8aPfKcncDL49YBxBv49GIO', 'Operator KLU', 'operator', '55555555-5555-5555-5555-555555555555', 1, NOW(), NOW()),
    ('f24a0fbf-95b9-411a-aff3-781fbaec94b9', 'dompu@kemenag.go.id', '$2b$10$okTdYvymK31q1Lh.OxqZ4.YMLeZ3iCXjSIfsY/3j7riVfo.1.tnnS', 'Operator Dompu', 'operator', '66666666-6666-6666-6666-666666666666', 1, NOW(), NOW()),
    ('e8369b51-76bc-4480-9080-0519ef8fb3f9', 'kabbima@kemenag.go.id', '$2b$10$9AWl8hM.Hx.SZryAk.lu/OU5DJJjzPcOvHi8CNrpef52CWY54UxCi', 'Operator Kab Bima', 'operator', '77777777-7777-7777-7777-777777777777', 1, NOW(), NOW()),
    ('6db3c38c-1e41-4a54-a30c-91a8ca4d99a1', 'kobi@kemenag.go.id', '$2b$10$6ZdlDM22an4TxgBLaFgHWOwUvrgguVuVLTd7lEeczUqwKFNwqhuxK', 'Operator Kobi', 'operator', '88888888-8888-8888-8888-888888888888', 1, NOW(), NOW()),
    ('0e7d4791-93ba-4e4a-bc5c-f9e320228976', 'lobar@kemenag.go.id', '$2b$10$gpGg4pyH5hiEPVLt0HJmQO3L345.9kRCJ1EtyOLqZ1sJXV4aba5Wi', 'Operator Lobar', 'operator', '99999999-9999-9999-9999-999999999999', 1, NOW(), NOW()),
    ('734f49a8-b979-4efd-8ed1-2ce71ca23f21', 'sumbawa@kemenag.go.id', '$2b$10$dYFXVxM9.5Y7HCrTGco9nO/cOttjIoUEaEcg3cq9RDqDAij1I7MRy', 'Operator Sumbawa', 'operator', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 1, NOW(), NOW())
  `);
  console.log('✅ Users seeded (11 records)');
};
