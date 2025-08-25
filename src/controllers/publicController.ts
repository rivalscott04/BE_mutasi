import { Request, Response } from 'express';
import Pegawai from '../models/Pegawai';
import Office from '../models/Office';
import { Op } from 'sequelize';
import logger from '../utils/logger';

export const getAllPegawaiPublic = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const search = req.query.search as string;
    const officeId = req.query.office_id as string;

    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause: any = {};
    
    if (search) {
      whereClause[Op.or] = [
        { nama: { [Op.iLike]: `%${search}%` } },
        { nip: { [Op.iLike]: `%${search}%` } },
        { jabatan: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (officeId) {
      whereClause.kantor_id = officeId;
    }

    const { count, rows: pegawai } = await Pegawai.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Office,
          as: 'office',
          foreignKey: 'kantor_id',
          attributes: ['id', 'name', 'kode_kabko', 'address']
        }
      ],
      attributes: [
        'id', 'nama', 'nip', 'jabatan', 'golongan', 'tmt_pensiun',
        'unit_kerja', 'induk_unit', 'kantor_id', 'dibuat_pada', 'diubah_pada'
      ],
      limit,
      offset,
      order: [['nama', 'ASC']]
    });

    const totalPages = Math.ceil(count / limit);

    logger.info('Public pegawai data requested', {
      page,
      limit,
      totalCount: count,
      search: search || 'none',
      officeId: officeId || 'all'
    });

    res.json({
      success: true,
      data: pegawai,
      pagination: {
        page,
        limit,
        total: count,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    logger.error('Error fetching public pegawai data', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data pegawai',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

export const getAllPegawaiPublicSimple = async (req: Request, res: Response) => {
  try {
    const search = req.query.search as string;
    const officeId = req.query.office_id as string;

    // Build where clause
    const whereClause: any = {};
    
    if (search) {
      whereClause[Op.or] = [
        { nama: { [Op.iLike]: `%${search}%` } },
        { nip: { [Op.iLike]: `%${search}%` } },
        { jabatan: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (officeId) {
      whereClause.kantor_id = officeId;
    }

    const pegawai = await Pegawai.findAll({
      where: whereClause,
      include: [
        {
          model: Office,
          as: 'office',
          foreignKey: 'kantor_id',
          attributes: ['id', 'name', 'kode_kabko', 'address']
        }
      ],
      attributes: [
        'id', 'nama', 'nip', 'jabatan', 'golongan', 'tmt_pensiun',
        'unit_kerja', 'induk_unit', 'kantor_id', 'dibuat_pada', 'diubah_pada'
      ],
      order: [['nama', 'ASC']]
    });

    logger.info('Public pegawai data requested (simple)', {
      totalCount: pegawai.length,
      search: search || 'none',
      officeId: officeId || 'all'
    });

    res.json({
      success: true,
      data: pegawai,
      total: pegawai.length
    });

  } catch (error) {
    logger.error('Error fetching public pegawai data (simple)', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data pegawai',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};
