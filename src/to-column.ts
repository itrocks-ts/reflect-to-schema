import { Type as TargetType } from '@itrocks/class-type'
import { formerNameOf }       from '@itrocks/former-name'
import { TypeType }           from '@itrocks/property-type'
import { ReflectClass }       from '@itrocks/reflect'
import { ReflectProperty }    from '@itrocks/reflect'
import { toColumn }           from '@itrocks/rename'
import { Column }             from '@itrocks/schema'
import { Type }               from '@itrocks/schema'
import { ToType }             from './to-type'

export class ToColumn
{
	toType = new ToType()

	convertMultiple<T extends object = object>(type: TargetType<T>): Column[]
	{
		const columns = [new Column('id', this.idType(), { autoIncrement: true })]
		for (const property of new ReflectClass(type).properties) {
			const column = this.convertProperty(property)
			if (!column) continue
			columns.push(column)
		}
		return columns
	}

	convertProperty<T extends object>(property: ReflectProperty<T>): Column | undefined
	{
		let columnName = toColumn(property.name)
		let type       = this.toType.convert<T>(property)
		if (this.toType.isId(property, type)) {
			columnName += '_id'
			type        = this.idType()
		}
		return type
			? new Column(columnName, type, {
				canBeNull:   property.type.optional,
				default:     property.defaultValue ?? (property.type.optional ? null : undefined),
				formerNames: formerNameOf(property.class.type, property.name).map(propertyName => toColumn(propertyName))
			})
			: undefined
	}

	idType()
	{
		return new Type('integer', { maxValue: 2e9, signed: false, zeroFill: false })
	}

}
