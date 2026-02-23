import { FeeStructure, FeeComponent, FeeComponentType, FeeFrequency } from '@models/FeeStructure.model';
import { Transaction, Op } from 'sequelize';

/**
 * Fee Structure Repository
 * Handles database operations for fee structures and components
 * Requirements: 9.1, 9.2
 */

export interface CreateFeeStructureData {
  name: string;
  applicableClasses: number[];
  applicableShifts: string[];
  academicYearId: number;
  description?: string;
  feeComponents: CreateFeeComponentData[];
}

export interface CreateFeeComponentData {
  name: string;
  type: FeeComponentType;
  amount: number;
  frequency: FeeFrequency;
  isMandatory: boolean;
  description?: string;
}

export interface UpdateFeeStructureData {
  name?: string;
  applicableClasses?: number[];
  applicableShifts?: string[];
  isActive?: boolean;
  description?: string;
}

export interface FeeStructureFilters {
  academicYearId?: number;
  isActive?: boolean;
  gradeLevel?: number;
  shift?: string;
}

class FeeStructureRepository {
  /**
   * Create a new fee structure with components
   */
  async create(data: CreateFeeStructureData, transaction?: Transaction): Promise<FeeStructure> {
    // Create fee structure
    const feeStructure = await FeeStructure.create(
      {
        name: data.name,
        applicableClasses: data.applicableClasses,
        applicableShifts: data.applicableShifts,
        academicYearId: data.academicYearId,
        description: data.description,
        totalAmount: 0, // Will be calculated after components are created
        isActive: true
      },
      { transaction }
    );

    // Create fee components
    if (data.feeComponents && data.feeComponents.length > 0) {
      const components = await Promise.all(
        data.feeComponents.map(component =>
          FeeComponent.create(
            {
              feeStructureId: feeStructure.feeStructureId,
              name: component.name,
              type: component.type,
              amount: component.amount,
              frequency: component.frequency,
              isMandatory: component.isMandatory,
              description: component.description
            },
            { transaction }
          )
        )
      );

      // Calculate and update total amount
      const totalAmount = components.reduce((sum, comp) => sum + Number(comp.amount), 0);
      await feeStructure.update({ totalAmount }, { transaction });
    }

    // Reload with components
    const reloaded = await this.findById(feeStructure.feeStructureId);
    if (!reloaded) {
      throw new Error('Failed to reload fee structure after creation');
    }
    return reloaded;
  }

  /**
   * Find fee structure by ID
   */
  async findById(id: number): Promise<FeeStructure | null> {
    return FeeStructure.findByPk(id, {
      include: [
        {
          model: FeeComponent,
          as: 'feeComponents'
        }
      ]
    });
  }

  /**
   * Find all fee structures with filters
   */
  async findAll(filters: FeeStructureFilters = {}): Promise<FeeStructure[]> {
    const where: any = {};

    if (filters.academicYearId !== undefined) {
      where.academicYearId = filters.academicYearId;
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    // For grade level and shift, we need to use JSON operators
    if (filters.gradeLevel !== undefined) {
      where.applicableClasses = {
        [Op.contains]: [filters.gradeLevel]
      };
    }

    if (filters.shift !== undefined) {
      where.applicableShifts = {
        [Op.contains]: [filters.shift]
      };
    }

    return FeeStructure.findAll({
      where,
      include: [
        {
          model: FeeComponent,
          as: 'feeComponents'
        }
      ],
      order: [['createdAt', 'DESC']]
    });
  }

  /**
   * Find fee structures applicable to a specific class and shift
   */
  async findApplicable(
    gradeLevel: number,
    shift: string,
    academicYearId: number
  ): Promise<FeeStructure[]> {
    return FeeStructure.findAll({
      where: {
        academicYearId,
        isActive: true,
        applicableClasses: {
          [Op.contains]: [gradeLevel]
        },
        applicableShifts: {
          [Op.contains]: [shift]
        }
      },
      include: [
        {
          model: FeeComponent,
          as: 'feeComponents'
        }
      ]
    });
  }

  /**
   * Update fee structure
   */
  async update(
    id: number,
    data: UpdateFeeStructureData,
    transaction?: Transaction
  ): Promise<FeeStructure | null> {
    const feeStructure = await FeeStructure.findByPk(id);
    if (!feeStructure) {
      return null;
    }

    await feeStructure.update(data, { transaction });
    return this.findById(id);
  }

  /**
   * Soft delete fee structure
   */
  async delete(id: number, transaction?: Transaction): Promise<boolean> {
    const feeStructure = await FeeStructure.findByPk(id);
    if (!feeStructure) {
      return false;
    }

    await feeStructure.destroy({ transaction });
    return true;
  }

  /**
   * Add fee component to structure
   */
  async addComponent(
    feeStructureId: number,
    componentData: CreateFeeComponentData,
    transaction?: Transaction
  ): Promise<FeeComponent | null> {
    const feeStructure = await FeeStructure.findByPk(feeStructureId);
    if (!feeStructure) {
      return null;
    }

    const component = await FeeComponent.create(
      {
        feeStructureId,
        name: componentData.name,
        type: componentData.type,
        amount: componentData.amount,
        frequency: componentData.frequency,
        isMandatory: componentData.isMandatory,
        description: componentData.description
      },
      { transaction }
    );

    // Recalculate total amount
    const totalAmount = await feeStructure.calculateTotalAmount();
    await feeStructure.update({ totalAmount }, { transaction });

    return component;
  }

  /**
   * Update fee component
   */
  async updateComponent(
    componentId: number,
    data: Partial<CreateFeeComponentData>,
    transaction?: Transaction
  ): Promise<FeeComponent | null> {
    const component = await FeeComponent.findByPk(componentId);
    if (!component) {
      return null;
    }

    await component.update(data, { transaction });

    // Recalculate total amount for the fee structure
    const feeStructure = await FeeStructure.findByPk(component.feeStructureId);
    if (feeStructure) {
      const totalAmount = await feeStructure.calculateTotalAmount();
      await feeStructure.update({ totalAmount }, { transaction });
    }

    return component;
  }

  /**
   * Remove fee component
   */
  async removeComponent(componentId: number, transaction?: Transaction): Promise<boolean> {
    const component = await FeeComponent.findByPk(componentId);
    if (!component) {
      return false;
    }

    const feeStructureId = component.feeStructureId;
    await component.destroy({ transaction });

    // Recalculate total amount for the fee structure
    const feeStructure = await FeeStructure.findByPk(feeStructureId);
    if (feeStructure) {
      const totalAmount = await feeStructure.calculateTotalAmount();
      await feeStructure.update({ totalAmount }, { transaction });
    }

    return true;
  }

  /**
   * Get fee components by structure ID
   */
  async getComponents(feeStructureId: number): Promise<FeeComponent[]> {
    return FeeComponent.findAll({
      where: { feeStructureId },
      order: [['type', 'ASC'], ['name', 'ASC']]
    });
  }

  /**
   * Get mandatory components for a fee structure
   */
  async getMandatoryComponents(feeStructureId: number): Promise<FeeComponent[]> {
    return FeeComponent.findAll({
      where: {
        feeStructureId,
        isMandatory: true
      },
      order: [['type', 'ASC'], ['name', 'ASC']]
    });
  }

  /**
   * Get optional components for a fee structure
   */
  async getOptionalComponents(feeStructureId: number): Promise<FeeComponent[]> {
    return FeeComponent.findAll({
      where: {
        feeStructureId,
        isMandatory: false
      },
      order: [['type', 'ASC'], ['name', 'ASC']]
    });
  }

  /**
   * Activate fee structure
   */
  async activate(id: number, transaction?: Transaction): Promise<FeeStructure | null> {
    return this.update(id, { isActive: true }, transaction);
  }

  /**
   * Deactivate fee structure
   */
  async deactivate(id: number, transaction?: Transaction): Promise<FeeStructure | null> {
    return this.update(id, { isActive: false }, transaction);
  }

  /**
   * Get active fee structures for an academic year
   */
  async getActiveByAcademicYear(academicYearId: number): Promise<FeeStructure[]> {
    return this.findAll({ academicYearId, isActive: true });
  }

  /**
   * Check if fee structure exists for given criteria
   */
  async exists(
    academicYearId: number,
    gradeLevel: number,
    shift: string
  ): Promise<boolean> {
    const count = await FeeStructure.count({
      where: {
        academicYearId,
        isActive: true,
        applicableClasses: {
          [Op.contains]: [gradeLevel]
        },
        applicableShifts: {
          [Op.contains]: [shift]
        }
      }
    });
    return count > 0;
  }
}

export default new FeeStructureRepository();
