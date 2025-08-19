import db from '../utils/db';
import Pengajuan from '../models/Pengajuan';
import JobTypeConfiguration from '../models/JobTypeConfiguration';

async function checkPengajuan() {
  try {
    console.log('🔍 Checking pengajuan data...');
    console.log('=====================================');

    const pengajuanList = await Pengajuan.findAll({
      order: [['created_at', 'DESC']],
      limit: 10
    });

    if (pengajuanList.length === 0) {
      console.log('❌ No pengajuan found in database');
    } else {
      console.log(`✅ Found ${pengajuanList.length} pengajuan records:`);
      console.log('');
      
      for (const pengajuan of pengajuanList) {
        console.log(`📋 Pengajuan ID: ${pengajuan.id}`);
        console.log(`   - Pegawai NIP: ${pengajuan.pegawai_nip}`);
        console.log(`   - Jenis Jabatan: ${pengajuan.jenis_jabatan}`);
        console.log(`   - Total Dokumen: ${pengajuan.total_dokumen}`);
        console.log(`   - Status: ${pengajuan.status}`);
        console.log(`   - Created: ${pengajuan.created_at}`);
        
        // Check if jenis_jabatan exists in job type configurations
        const jobType = await JobTypeConfiguration.findOne({
          where: { jenis_jabatan: pengajuan.jenis_jabatan }
        });
        if (jobType) {
          console.log(`   ✅ Job Type Config Found: ${jobType.jenis_jabatan} (ID: ${jobType.id})`);
          console.log(`      - Max Dokumen: ${jobType.max_dokumen}`);
          console.log(`      - Active: ${jobType.is_active ? 'Yes' : 'No'}`);
        } else {
          console.log(`   ❌ Job Type Config NOT Found for jenis_jabatan: ${pengajuan.jenis_jabatan}`);
        }
        console.log('');
      }
    }

    // Check all job type configurations
    console.log('🔍 All Job Type Configurations:');
    console.log('=====================================');
    const jobTypes = await JobTypeConfiguration.findAll({
      order: [['jenis_jabatan', 'ASC']]
    });

    if (jobTypes.length === 0) {
      console.log('❌ No job type configurations found');
    } else {
      jobTypes.forEach((jobType, index) => {
        console.log(`${index + 1}. ${jobType.jenis_jabatan} (ID: ${jobType.id})`);
        console.log(`   - Max Dokumen: ${jobType.max_dokumen}`);
        console.log(`   - Active: ${jobType.is_active ? 'Yes' : 'No'}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Error checking pengajuan:', error);
  } finally {
    await db.close();
  }
}

checkPengajuan();
