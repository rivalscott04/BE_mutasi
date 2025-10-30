import { Request, Response } from 'express';
import TrackingStatus from '../models/TrackingStatus';
import PengajuanTracking from '../models/PengajuanTracking';
import Pengajuan from '../models/Pengajuan';
import Pegawai from '../models/Pegawai';
import Office from '../models/Office';
import User from '../models/User';
import { Op } from 'sequelize';
import fs from 'fs';
import path from 'path';

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

    const { page = 1, limit = 1000, search = '', status = '' } = req.query;
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
  let user: any = null;
  try {
    user = (req as any).user;
    const { pengajuanId } = req.params;
    const { tracking_status_id, notes, estimated_days } = req.body;

    // DEBUG: Log semua parameter input
    console.log('[DEBUG INPUT TRACKING]', {
      pengajuanId,
      tracking_status_id,
      notes,
      estimated_days,
      user: user ? { id: user.id, email: user.email, full_name: user.full_name, role: user.role } : null
    });

    // Hanya user (admin pusat) yang bisa input tracking
    if (user.role !== 'user') {
      console.warn('[WARN] Role tidak diizinkan input tracking:', user.role);
      return res.status(403).json({ message: 'Unauthorized' });
    }
    if (!tracking_status_id) {
      console.warn('[WARN] tracking_status_id kosong');
      return res.status(400).json({ message: 'Tracking status harus diisi' });
    }
    // Cek apakah pengajuan ada dan sudah final approved
    const pengajuan = await Pengajuan.findByPk(pengajuanId);
    console.log('[DEBUG PENGAJUAN]', pengajuan ? pengajuan.toJSON() : pengajuan);
    if (!pengajuan) {
      return res.status(404).json({ message: 'Pengajuan tidak ditemukan' });
    }
    if (pengajuan.status !== 'final_approved') {
      return res.status(400).json({ message: 'Pengajuan harus sudah final approved untuk ditrack' });
    }
    // Cek apakah status master ada
    const statusMaster = await TrackingStatus.findByPk(tracking_status_id);
    console.log('[DEBUG TRACKING STATUS MASTER]', statusMaster ? statusMaster.toJSON() : statusMaster);
    if (!statusMaster) {
      return res.status(404).json({ message: 'Status tracking tidak ditemukan' });
    }
    // Buat tracking record
    try {
      console.log('[DEBUG] Akan membuat PengajuanTracking...');
      const tracking = await PengajuanTracking.create({
        pengajuan_id: pengajuanId,
        tracking_status_id,
        status_name: statusMaster.status_name,
        notes,
        estimated_days,
        tracked_by: user.id,
        tracked_by_name: user.full_name
      });
      console.log('[DEBUG SUKSES CREATE TRACKING]', tracking ? tracking.toJSON() : tracking);
      res.json({
        success: true,
        data: tracking
      });
    } catch (createError) {
      let errorStack = '';
      let errorMsg = '';
      if (createError instanceof Error) {
        errorStack = createError.stack ?? '';
        errorMsg = createError.message;
      } else {
        errorStack = String(createError);
        errorMsg = String(createError);
      }
      console.error('[ERROR CREATE TRACKING]', createError, errorStack);

      // --- LOG KE FILE ---
      try {
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        const dir = path.resolve(__dirname, '../../logs');
        const filename = `error-${y}-${m}-${d}.log`;
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        const logMessage = `[${now.toISOString()}] [TRACKING_CONTROLLER]\n` +
          `User: ${user ? JSON.stringify({ id: user.id, email: user.email, full_name: user.full_name, role: user.role }) : '-'}\n` +
          `Params: ${JSON.stringify(req.params)}\n` +
          `Body: ${JSON.stringify(req.body)}\n` +
          `ErrorMsg: ${errorMsg}\n` +
          `ErrorStack: ${errorStack}\n\n`;
        fs.appendFileSync(path.join(dir, filename), logMessage, 'utf8');
      } catch (fileLogErr) {
        console.error('[FILE_LOG_ERROR]', fileLogErr);
      }
      throw createError;
    }
  } catch (error) {
    let errorMsg = '', errorStack = '';
    if (error instanceof Error) {
      errorMsg = error.message;
      errorStack = error.stack ?? '';
    } else {
      errorMsg = String(error);
      errorStack = '';
    }
    console.error('Error in createPengajuanTracking:', error, errorStack);
    // --- LOG ERROR KE FILE ---
    try {
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const d = String(now.getDate()).padStart(2, '0');
      const dir = path.resolve(__dirname, '../../logs');
      const filename = `error-${y}-${m}-${d}.log`;
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const logMessage = `[${now.toISOString()}] [TRACKING_CONTROLLER-CATCH]\n` +
        `User: ${user ? JSON.stringify({ id: user.id, email: user.email, full_name: user.full_name, role: user.role }) : '-'}\n` +
        `Params: ${JSON.stringify(req.params)}\n` +
        `Body: ${JSON.stringify(req.body)}\n` +
        `ErrorMsg: ${errorMsg}\n` +
        `ErrorStack: ${errorStack}\n\n`;
      fs.appendFileSync(path.join(dir, filename), logMessage, 'utf8');
    } catch (fileLogErr) {
      console.error('[FILE_LOG_ERROR]', fileLogErr);
    }
    return res.status(500).json({ message: 'Internal server error', detail: errorMsg });
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

    const { page = 1, limit = 1000, search = '', status = '' } = req.query;
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

    // Ambil pengajuan yang sudah final approved
    const { count, rows: pengajuan } = await Pengajuan.findAndCountAll({
      where: whereClause,
      limit: Number(limit),
      offset,
      order: [['final_approved_at', 'DESC']],
      include: [
        {
          model: Office,
          as: 'office',
          attributes: ['id', 'name', 'kabkota'],
          required: false
        },
        {
          model: Pegawai,
          as: 'pegawai',
          attributes: ['id', 'nip', 'nama'],
          required: false
        }
      ]
    });

    // Ambil tracking data untuk setiap pengajuan
    const pengajuanWithTracking = await Promise.all(
      pengajuan.map(async (p) => {
        const pengajuanData = p.toJSON() as any;
        
        // Ambil tracking data untuk pengajuan ini (tanpa relasi dulu untuk testing)
        const trackingData = await PengajuanTracking.findAll({
          where: { pengajuan_id: p.id },
          order: [['created_at', 'DESC']]
        });

        return {
          ...pengajuanData,
          tracking: trackingData.map(t => ({
            ...t.toJSON(),
            tracked_by_name: t.tracked_by_name || 'Unknown'
          }))
        };
      })
    );

    res.json({
      success: true,
      data: pengajuanWithTracking,
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

    // Ambil pengajuan yang sudah final approved
    const { count, rows: pengajuan } = await Pengajuan.findAndCountAll({
      where: whereClause,
      limit: Number(limit),
      offset,
      order: [['final_approved_at', 'DESC']],
      include: [
        {
          model: Office,
          as: 'office',
          attributes: ['id', 'name', 'kabkota'],
          required: false
        },
        {
          model: Pegawai,
          as: 'pegawai',
          attributes: ['id', 'nip', 'nama'],
          required: false
        }
      ]
    });

    // Ambil tracking data untuk setiap pengajuan
    const pengajuanWithTracking = await Promise.all(
      pengajuan.map(async (p) => {
        const pengajuanData = p.toJSON() as any;
        // Ambil tracking data untuk pengajuan ini
        const trackingData = await PengajuanTracking.findAll({
          where: { pengajuan_id: p.id },
          order: [['created_at', 'DESC']]
        });
        // Tracking terbaru (atau null jika belum ada)
        const latestTracking = trackingData[0] || null;
        const latestTrackingDate = latestTracking ? latestTracking.created_at : null;

        return {
          ...pengajuanData,
          tracking: trackingData.map((t: any) => ({
            ...t.toJSON(),
            tracked_by_name: t.tracked_by_name || 'Unknown'
          })),
          latestTrackingDate
        };
      })
    );

    // Sorting:
    // - Punya tracking (latestTrackingDate != null) selalu di atas (DESC)
    // - Yang punya tracking diurutkan dari paling baru ke paling lama (created_at DESC)
    // - Yang belum punya tracking di bawah (latestTrackingDate null)
    pengajuanWithTracking.sort((a, b) => {
      if (a.latestTrackingDate && b.latestTrackingDate) {
        // Dua-duanya punya tracking, urutkan terbaru dulu
        return new Date(b.latestTrackingDate).getTime() - new Date(a.latestTrackingDate).getTime();
      } else if (a.latestTrackingDate && !b.latestTrackingDate) {
        // a punya tracking, b tidak => a di atas
        return -1;
      } else if (!a.latestTrackingDate && b.latestTrackingDate) {
        // b punya tracking, a tidak => b di atas
        return 1;
      } else {
        // Dua-duanya sama-sama kosong (tidak punya tracking)
        return 0;
      }
    });

    res.json({
      success: true,
      data: pengajuanWithTracking,
      pagination: {
        total: count,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(count / Number(limit))
      }
    });

  } catch (error) {
    console.error('Error in getTrackingForAdmin:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}