/**
 * Certificate Template Model
 * 
 * Implements certificate template entity with support for dynamic fields
 * and multiple certificate types
 * 
 * Requirements: 25.2
 */

import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '@config/database';

export interface CertificateTemplateAttributes {
  templateId: number;
  name: string;
  type: 'character' | 'transfer' | 'academic_excellence' | 'eca' | 'sports' | 'course_completion' | 'bonafide';
  templateHtml: string;
  variables: string[];
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CertificateTemplateCreationAttributes 
  extends Optional<CertificateTemplateAttributes, 'templateId' | 'isActive'> {}

export class CertificateTemplate
  extends Model<CertificateTemplateAttributes, CertificateTemplateCreationAttributes>
  implements CertificateTemplateAttributes
{
  public templateId!: number;
  public name!: string;
  public type!: 'character' | 'transfer' | 'academic_excellence' | 'eca' | 'sports' | 'course_completion' | 'bonafide';
  public templateHtml!: string;
  public variables!: string[];
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  /**
   * Extract variables from template HTML
   * Variables are in the format {{variable_name}}
   */
  public extractVariables(): string[] {
    const regex = /\{\{([^}]+)\}\}/g;
    const matches = this.templateHtml.matchAll(regex);
    const variables = new Set<string>();
    
    for (const match of matches) {
      variables.add(match[1].trim());
    }
    
    return Array.from(variables);
  }

  /**
   * Validate that all required variables are present in the template
   */
  public validateVariables(): boolean {
    const extractedVars = this.extractVariables();
    return this.variables.every(v => extractedVars.includes(v));
  }

  /**
   * Replace variables in template with actual values
   */
  public renderTemplate(data: Record<string, any>): string {
    let rendered = this.templateHtml;
    
    for (const [key, value] of Object.entries(data)) {
      const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
      rendered = rendered.replace(regex, String(value || ''));
    }
    
    return rendered;
  }

public toJSON(): object {
    return {
      templateId: this.get('templateId') as number,
      name: this.get('name') as string,
      type: this.get('type') as string,
      templateHtml: this.get('templateHtml') as string,
      variables: this.get('variables') as string[],
      isActive: this.get('isActive') as boolean,
      createdAt: this.get('createdAt') as Date,
      updatedAt: this.get('updatedAt') as Date,
    };
  }
}

CertificateTemplate.init(
  {
    templateId: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
      field: 'template_id',
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM(
        'character',
        'transfer',
        'academic_excellence',
        'eca',
        'sports',
        'course_completion',
        'bonafide'
      ),
      allowNull: false,
    },
    templateHtml: {
      type: DataTypes.TEXT('long'),
      allowNull: false,
      field: 'template_html',
    },
    variables: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active',
    },
  },
  {
    sequelize,
    tableName: 'certificate_templates',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        name: 'idx_certificate_templates_type',
        fields: ['type'],
      },
      {
        name: 'idx_certificate_templates_active',
        fields: ['is_active'],
      },
      {
        name: 'idx_certificate_templates_type_active',
        fields: ['type', 'is_active'],
      },
    ],
  }
);

export default CertificateTemplate;
