import { db } from '../src/models';

async function checkAdminWilayahFileConfig() {
  try {
    console.log('🔍 Checking admin wilayah file configurations...');
    
    // Check all admin wilayah file configs
    const [configs] = await db.query(`
      SELECT 
        awfc.id,
        awfc.jenis_jabatan_id,
        awfc.file_type,
        awfc.display_name,
        awfc.is_required,
        awfc.is_active,
        jtc.jenis_jabatan
      FROM admin_wilayah_file_configuration awfc
      LEFT JOIN job_type_configuration jtc ON awfc.jenis_jabatan_id = jtc.id
      ORDER BY awfc.jenis_jabatan_id, awfc.file_type
    `);
    
    console.log('\n📋 Current admin wilayah file configurations:');
    console.table(configs);
    
    // Check for problematic file types
    const problematicConfigs = (configs as any[]).filter(config => 
      config.file_type === 'skbt' || 
      config.file_type === 'surat_keterangan_bebas_temuan' ||
      !config.file_type
    );
    
    if (problematicConfigs.length > 0) {
      console.log('\n⚠️  Found problematic configurations:');
      console.table(problematicConfigs);
      
      console.log('\n🔧 Suggested fixes:');
      problematicConfigs.forEach(config => {
        if (config.file_type === 'skbt') {
          console.log(`- Update ID ${config.id}: Change 'skbt' to 'surat_keterangan_bebas_temuan_inspektorat'`);
        } else if (config.file_type === 'surat_keterangan_bebas_temuan') {
          console.log(`- Update ID ${config.id}: Change 'surat_keterangan_bebas_temuan' to 'surat_keterangan_bebas_temuan_inspektorat'`);
        }
      });
    } else {
      console.log('\n✅ No problematic configurations found');
    }
    
    // Check available job types
    const [jobTypes] = await db.query(`
      SELECT id, jenis_jabatan, is_active 
      FROM job_type_configuration 
      ORDER BY id
    `);
    
    console.log('\n📋 Available job types:');
    console.table(jobTypes);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await db.close();
  }
}

checkAdminWilayahFileConfig();
