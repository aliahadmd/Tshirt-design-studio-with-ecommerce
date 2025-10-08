import { Response } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/auth';

export const createDesign = async (req: AuthRequest, res: Response) => {
  try {
    const { name, frontDesign, backDesign, tshirtColor, thumbnail } = req.body;

    if (!name || !frontDesign) {
      return res.status(400).json({ error: 'Name and front design are required' });
    }

    const design = await prisma.design.create({
      data: {
        name,
        frontDesign,
        backDesign: backDesign || null,
        tshirtColor: tshirtColor || '#ffffff',
        thumbnail: thumbnail || null,
        userId: req.userId!,
      },
    });

    res.status(201).json(design);
  } catch (error) {
    console.error('Create design error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getDesigns = async (req: AuthRequest, res: Response) => {
  try {
    const designs = await prisma.design.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
    });

    res.json(designs);
  } catch (error) {
    console.error('Get designs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getDesignById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const design = await prisma.design.findUnique({
      where: { id },
    });

    if (!design) {
      return res.status(404).json({ error: 'Design not found' });
    }

    if (design.userId !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(design);
  } catch (error) {
    console.error('Get design error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateDesign = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, frontDesign, backDesign, tshirtColor, thumbnail } = req.body;

    const existingDesign = await prisma.design.findUnique({
      where: { id },
    });

    if (!existingDesign) {
      return res.status(404).json({ error: 'Design not found' });
    }

    if (existingDesign.userId !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const design = await prisma.design.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(frontDesign && { frontDesign }),
        ...(backDesign !== undefined && { backDesign }),
        ...(tshirtColor && { tshirtColor }),
        ...(thumbnail !== undefined && { thumbnail }),
      },
    });

    res.json(design);
  } catch (error) {
    console.error('Update design error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteDesign = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const existingDesign = await prisma.design.findUnique({
      where: { id },
    });

    if (!existingDesign) {
      return res.status(404).json({ error: 'Design not found' });
    }

    if (existingDesign.userId !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await prisma.design.delete({
      where: { id },
    });

    res.json({ message: 'Design deleted successfully' });
  } catch (error) {
    console.error('Delete design error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

