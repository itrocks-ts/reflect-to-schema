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
		const columns = [new Column('id', new Type('integer', { signed: false, zeroFill: false }), { autoIncrement: true })]
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
		if ((property.type instanceof TypeType) && !type) {
			columnName += '_id'
			type        = new Type('integer', { signed: false, zeroFill: false })
		}
		return type
			? new Column(columnName, type, {
				default:     property.defaultValue,
				formerNames: formerNameOf(property.class.type, property.name)
			})
			: undefined
	}

}
