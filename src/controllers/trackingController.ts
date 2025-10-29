import { Request, Response } from 'express';
import TrackingStatus from '../models/TrackingStatus';
import PengajuanTracking from '../models/PengajuanTracking';
import Pengajuan from '../models/Pengajuan';
import Pegawai from '../models/Pegawai';
import Office from '../models/Office';
import User from '../models/User';
import { Op } from 'sequelize';

// GET /api/tracking/status-master - Ambil semua status master (untuk dropdown)
export async function getTrackingStatusMaster(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    
    // Hanya admin_pusat dan admin yang bisa akses
    if (!['user', 'admin'].includes(user.role)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const statuses = await TrackingStatus.findAll({
      where: { is_active: true },
      order: [['sort_order', 'ASC'], ['status_name', 'ASC']]
    });

    res.json({
      success: true,
      data: statuses
    });

  } catch (error) {
    console.error('Error in getTrackingStatusMaster:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// GET /api/tracking/status-master/all - Ambil semua status master untuk admin (termasuk yang tidak aktif)
export async function getAllTrackingStatusMaster(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    
    // Admin dan user (admin pusat) bisa akses semua status
    if (!['admin', 'user'].includes(user.role)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const statuses = await TrackingStatus.findAll({
      order: [['sort_order', 'ASC'], ['status_name', 'ASC']]
    });

    res.json({
      success: true,
      data: statuses
    });

  } catch (error) {
    console.error('Error in getAllTrackingStatusMaster:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// POST /api/tracking/status-master - Buat status master baru (admin dan user)
export async function createTrackingStatusMaster(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    
    // Admin dan user (admin pusat) bisa buat status master
    if (!['admin', 'user'].includes(user.role)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const { status_name, status_code, description, sort_order } = req.body;

    if (!status_name) {
      return res.status(400).json({ message: 'Status name harus diisi' });
    }

    // Generate status_code otomatis jika tidak ada
    const finalStatusCode = status_code || `status-${Date.now()}`;

    // Cek apakah status_code sudah ada
    const existingStatus = await TrackingStatus.findOne({
      where: { status_code: finalStatusCode }
    });

    if (existingStatus) {
      return res.status(400).json({ message: 'Status code sudah digunakan' });
    }

    const status = await TrackingStatus.create({
      status_name,
      status_code: finalStatusCode,
      description,
      sort_order: sort_order || 0,
      created_by: user.id
    });

    res.json({
      success: true,
      data: status
    });

  } catch (error) {
    console.error('Error in createTrackingStatusMaster:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// PUT /api/tracking/status-master/:id - Update status master (admin dan user)
export async function updateTrackingStatusMaster(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    
    // Admin dan user (admin pusat) bisa update status master
    if (!['admin', 'user'].includes(user.role)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const { status_name, status_code, description, is_active, sort_order } = req.body;

    if (!status_name) {
      return res.status(400).json({ message: 'Status name harus diisi' });
    }

    // Cek apakah status ada
    const status = await TrackingStatus.findByPk(id);
    if (!status) {
      return res.status(404).json({ message: 'Status tracking tidak ditemukan' });
    }

    // Gunakan status_code yang ada atau generate yang baru
    const finalStatusCode = status_code || status.status_code;

    // Cek apakah status_code sudah ada (kecuali untuk status yang sama)
    const existingStatus = await TrackingStatus.findOne({
      where: { 
        status_code: finalStatusCode,
        id: { [Op.ne]: id }
      }
    });

    if (existingStatus) {
      return res.status(400).json({ message: 'Status code sudah digunakan' });
    }

    // Update status
    await status.update({
      status_name,
      status_code: finalStatusCode,
      description,
      is_active: is_active !== undefined ? is_active : status.is_active,
      sort_order: sort_order !== undefined ? sort_order : status.sort_order
    });

    res.json({
      success: true,
      data: status
    });

  } catch (error) {
    console.error('Error in updateTrackingStatusMaster:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// DELETE /api/tracking/status-master/:id - Hapus status master (admin dan user)
export async function deleteTrackingStatusMaster(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    
    // Admin dan user (admin pusat) bisa hapus status master
    if (!['admin', 'user'].includes(user.role)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Cek apakah status ada
    const status = await TrackingStatus.findByPk(id);
    if (!status) {
      return res.status(404).json({ message: 'Status tracking tidak ditemukan' });
    }

    // Cek apakah status sedang digunakan di pengajuan_tracking
    const trackingCount = await PengajuanTracking.count({
      where: { tracking_status_id: id }
    });

    if (trackingCount > 0) {
      return res.status(400).json({ 
        message: 'Status tidak bisa dihapus karena sedang digunakan dalam tracking' 
      });
    }

    // Hapus status
    await status.destroy();

    res.json({
      success: true,
      message: 'Status tracking berhasil dihapus'
    });

  } catch (error) {
    console.error('Error in deleteTrackingStatusMaster:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// GET /api/tracking/pengajuan - Ambil berkas yang sudah final approved untuk ditrack
export async function getPengajuanForTracking(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    
    // Hanya user (admin pusat) yang bisa akses
    if (user.role !== 'user') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const { page = 1, limit = 10, search = '', status = '' } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    // Query untuk berkas yang sudah final approved
    const whereClause: any = {
      status: 'final_approved'
    };

    // Filter search
    if (search) {
      whereClause[Op.or] = [
        { pegawai_nip: { [Op.like]: `%${search}%` } },
        { jenis_jabatan: { [Op.like]: `%${search}%` } }
      ];
    }

    // Query pengajuan dulu tanpa relasi
    const { count, rows: pengajuan } = await Pengajuan.findAndCountAll({
      where: whereClause,
      limit: Number(limit),
      offset,
      order: [['final_approved_at', 'DESC']]
    });

    // Ambil data pegawai, kantor, dan tracking secara terpisah
    const pengajuanWithDetails = await Promise.all(
      pengajuan.map(async (p) => {
        // Ambil data pegawai
        const pegawai = await Pegawai.findOne({
          where: { nip: p.pegawai_nip }
        });

        // Ambil data office berdasarkan office_id dari pengajuan
        const office = await Office.findByPk(p.office_id);

        // Ambil data tracking untuk pengajuan ini
        const tracking = await PengajuanTracking.findAll({
          where: { pengajuan_id: p.id },
          order: [['created_at', 'DESC']],
          include: [
            {
              model: TrackingStatus,
              as: 'status'
            }
          ]
        });

        const result = {
          ...p.toJSON(),
          pegawai: pegawai ? {
            nama: pegawai.nama,
            nip: pegawai.nip
          } : null,
          office: office ? {
            nama_kantor: office.name,
            kabkota: office.kabkota,
            alamat: office.address
          } : null,
          tracking: tracking.map(t => ({
            id: t.id,
            tracking_status_id: t.tracking_status_id,
            status_name: t.status_name,
            notes: t.notes,
            estimated_days: t.estimated_days,
            created_at: t.created_at,
            tracked_by_name: t.tracked_by_name
          }))
        };

        console.log('Result for', p.pegawai_nip, ':', {
          pegawaiNama: result.pegawai?.nama,
          kantorNama: result.office?.nama_kantor,
          kabkota: result.office?.kabkota,
          officeId: p.office_id,
          trackingCount: result.tracking.length
        });

        return result;
      })
    );

    console.log('Query result:', { count, pengajuanCount: pengajuanWithDetails.length });

    res.json({
      success: true,
      data: pengajuanWithDetails,
      pagination: {
        total: count,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(count / Number(limit))
      }
    });

  } catch (error) {
    console.error('Error in getPengajuanForTracking:', error);
    return res.status(500).json({ 
      message: 'Internal server error', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}

// POST /api/tracking/pengajuan/:pengajuanId - Input tracking status untuk berkas
export async function createPengajuanTracking(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const { pengajuanId } = req.params;
    const { tracking_status_id, notes, estimated_days } = req.body;
    
    // Hanya user (admin pusat) yang bisa input tracking
    if (user.role !== 'user') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (!tracking_status_id) {
      return res.status(400).json({ message: 'Tracking status harus diisi' });
    }

    // Cek apakah pengajuan ada dan sudah final approved
    const pengajuan = await Pengajuan.findByPk(pengajuanId);
    if (!pengajuan) {
      return res.status(404).json({ message: 'Pengajuan tidak ditemukan' });
    }

    if (pengajuan.status !== 'final_approved') {
      return res.status(400).json({ message: 'Pengajuan harus sudah final approved untuk ditrack' });
    }

    // Cek apakah status master ada
    const statusMaster = await TrackingStatus.findByPk(tracking_status_id);
    if (!statusMaster) {
      return res.status(404).json({ message: 'Status tracking tidak ditemukan' });
    }

    // Buat tracking record
    const tracking = await PengajuanTracking.create({
      pengajuan_id: pengajuanId,
      tracking_status_id,
      status_name: statusMaster.status_name,
      notes,
      estimated_days,
      tracked_by: user.id,
      tracked_by_name: user.full_name
    });

    res.json({
      success: true,
      data: tracking
    });

  } catch (error) {
    console.error('Error in createPengajuanTracking:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// GET /api/tracking/pengajuan/:pengajuanId/history - Ambil history tracking untuk berkas
export async function getPengajuanTrackingHistory(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const { pengajuanId } = req.params;
    
    // Admin pusat (user) dan superadmin bisa akses
    if (!['user', 'admin'].includes(user.role)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const trackingHistory = await PengajuanTracking.findAll({
      where: { pengajuan_id: pengajuanId },
      order: [['created_at', 'DESC']],
      include: [
        {
          model: TrackingStatus,
          as: 'status'
        }
      ]
    });

    res.json({
      success: true,
      data: trackingHistory
    });

  } catch (error) {
    console.error('Error in getPengajuanTrackingHistory:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// GET /api/tracking/superadmin - Ambil tracking untuk superadmin (berkas dari wilayahnya)
export async function getTrackingForSuperadmin(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    
    // Hanya admin (superadmin) yang bisa akses
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const { page = 1, limit = 10, search = '', status = '' } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    // Query untuk berkas yang sudah final approved dan ada tracking
    const whereClause: any = {
      status: 'final_approved'
    };

    // Filter search
    if (search) {
      whereClause[Op.or] = [
        { pegawai_nip: { [Op.like]: `%${search}%` } },
        { jenis_jabatan: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows: pengajuan } = await Pengajuan.findAndCountAll({
      where: whereClause,
      limit: Number(limit),
      offset,
      order: [['final_approved_at', 'DESC']],
      include: [
        {
          model: Office,
          as: 'office',
          attributes: ['id', 'name', 'kabkota']
        },
        {
          model: Pegawai,
          as: 'pegawai',
          attributes: ['id', 'nip', 'nama_lengkap']
        },
        {
          model: PengajuanTracking,
          as: 'tracking',
          required: true, // INNER JOIN untuk ambil hanya yang ada tracking
          order: [['created_at', 'DESC']],
          include: [
            {
              model: TrackingStatus,
              as: 'status'
            },
            {
              model: User,
              as: 'tracker',
              attributes: ['id', 'nip', 'nama_lengkap']
            }
          ]
        }
      ]
    });

    // Transform data untuk memastikan kompatibilitas dengan frontend
    const transformedData = pengajuan.map(p => {
      const pengajuanData = p.toJSON() as any;
      return {
        ...pengajuanData,
        tracking: pengajuanData.tracking.map((t: any) => ({
          ...t,
          tracked_by_name: t.tracker?.nama_lengkap || t.tracked_by_name || 'Unknown'
        }))
      };
    });

    res.json({
      success: true,
      data: transformedData,
      pagination: {
        total: count,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(count / Number(limit))
      }
    });

  } catch (error) {
    console.error('Error in getTrackingForSuperadmin:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// GET /api/tracking/admin - Ambil tracking untuk admin biasa (readonly)
export async function getTrackingForAdmin(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    
    // Hanya admin yang bisa akses
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Test endpoint sederhana
    return res.json({
      success: true,
      data: [
        {
          id: 'test-1',
          pegawai_nip: '123456789',
          jenis_jabatan: 'Test Jabatan',
          total_dokumen: 5,
          final_approved_at: new Date().toISOString(),
          office: null,
          tracking: []
        }
      ],
      pagination: {
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1
      }
    });

  } catch (error) {
    console.error('Error in getTrackingForAdmin:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}