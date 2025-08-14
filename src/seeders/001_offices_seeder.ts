export const seed = async (db: any): Promise<void> => {
  await db.query(`
    INSERT IGNORE INTO \`offices\` (\`id\`, \`name\`, \`kabkota\`, \`address\`, \`phone\`, \`fax\`, \`email\`, \`website\`, \`kode_kabko\`, \`created_at\`, \`updated_at\`) VALUES 
    ('11111111-1111-1111-1111-111111111111', 'KANTOR KEMENTERIAN AGAMA', 'KOTA MATARAM', 'Jl. Pejanggik No. 83 Mataram', '(0370) 631079', '(0370) 642403', 'mataram@kemenag.go.id', 'www.kemenagkotamataram.go.id', '07', NOW(), NOW()),
    ('22222222-2222-2222-2222-222222222222', 'KANTOR KEMENTERIAN AGAMA', 'KABUPATEN LOMBOK TIMUR', 'Jln. Prof. Muh. Yamin,SH No. 6, Selong - Lombok Timur', '(0376) 21042', '(0376) 21042', 'lotim@kemenag.go.id', 'https://kemenaglotim.com', '03', NOW(), NOW()),
    ('33333333-3333-3333-3333-333333333333', 'KANTOR KEMENTERIAN AGAMA', 'KABUPATEN LOMBOK TENGAH', 'Jln. Jend. A. Yani No. 5 Praya - Lombok Tengah', '(0370) - 654057', '654422', 'loteng@kemenag.go.id', 'https://kemenaglomboktengah.com', '02', NOW(), NOW()),
    ('44444444-4444-4444-4444-444444444444', 'KANTOR KEMENTERIAN AGAMA', 'KABUPATEN SUMBAWA BARAT', '', NULL, NULL, 'ksb@kemenag.go.id', NULL, '09', NOW(), NOW()),
    ('55555555-5555-5555-5555-555555555555', 'KANTOR KEMENTERIAN AGAMA', 'KABUPATEN LOMBOK UTARA', 'Jalan Raya Tanjung - Bayan Karang Kates Gangga Kabupaten Lombok Utara', '(0370) 7509040', '83352', 'kablombokutara@kemenag.go.id', 'https://kemenagkablotara.go.id', '10', NOW(), NOW()),
    ('66666666-6666-6666-6666-666666666666', 'KANTOR KEMENTERIAN AGAMA', 'KABUPATEN DOMPU', 'Jl. Sonokling No. 03 Bada Dompu', '(0373) 21049', '(0373) 21049', 'kemenagkabdompu@yahoo.com', '-', '05', NOW(), NOW()),
    ('77777777-7777-7777-7777-777777777777', 'KANTOR KEMENTERIAN AGAMA', 'KABUPATEN BIMA', 'Jln. Garuda No. 3', '(0374) 43291 - 43660', '43291', 'upkemenag.kabbima@yahoo.com', '-', '06', NOW(), NOW()),
    ('88888888-8888-8888-8888-888888888888', 'KANTOR KEMENTERIAN AGAMA', 'KOTA BIMA', 'Jl Garuda No. 9, Lewirato,Kota Bima', '(0374) 44413 - 43500', '(0374) 43500', 'kotabima@kemenag.go.id', 'kotabima.kemenag.go.id', '08', NOW(), NOW()),
    ('99999999-9999-9999-9999-999999999999', 'KANTOR KEMENTERIAN AGAMA', 'KABUPATEN LOMBOK BARAT', '', NULL, NULL, 'lobar@kemenag.go.id', NULL, '01', NOW(), NOW()),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'KANTOR KEMENTERIAN AGAMA', 'KABUPATEN SUMBAWA', 'Jalan Durian Nomor 72 Sumbawa Besar 84317', '0371-212299', '0371-22524', 'kabsumbawa@kemenag.go.id', '-', '04', NOW(), NOW())
  `);
  console.log('✅ Offices seeded (10 records)');
};
