import db from '../utils/db';
import JobTypeConfiguration from '../models/JobTypeConfiguration';

async function checkJobTypes() {
  try {
    console.log('🔍 Checking job type configurations...');
    console.log('=====================================');

    const jobTypes = await JobTypeConfiguration.findAll({
      order: [['jenis_jabatan', 'ASC']]
    });

    if (jobTypes.length === 0) {
      console.log('❌ No job type configurations found in database');
      console.log('💡 Run seed-job-types.ts to add default configurations');
    } else {
      console.log(`✅ Found ${jobTypes.length} job type configurations:`);
      console.log('');
      
      jobTypes.forEach((jobType, index) => {
        console.log(`${index + 1}. ${jobType.jenis_jabatan}`);
        console.log(`   - ID: ${jobType.id}`);
        console.log(`   - Min Dokumen: ${jobType.min_dokumen}`);
        console.log(`   - Max Dokumen: ${jobType.max_dokumen}`);
        console.log(`   - Active: ${jobType.is_active ? 'Yes' : 'No'}`);
        
        try {
          const requiredFiles = JSON.parse(jobType.required_files);
          console.log(`   - Required Files: ${requiredFiles.length} files`);
          console.log(`     ${requiredFiles.join(', ')}`);
        } catch (error) {
          console.log(`   - Required Files: Error parsing JSON`);
        }
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Error checking job types:', error);
  } finally {
    await db.close();
  }
}

checkJobTypes();
