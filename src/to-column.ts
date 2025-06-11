import { isAnyType }          from '@itrocks/class-type'
import { Type as TargetType } from '@itrocks/class-type'
import { formerNameOf }       from '@itrocks/former-name'
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
		const type = this.toType.convert<T>(property)
		return type
			? new Column(toColumn(property.name), type, {
				default:     property.defaultValue,
				formerNames: formerNameOf(property.class.type, property.name)
			})
			: isAnyType(property.type)
			? new Column(toColumn(property.name) + '_id', new Type('integer', { signed: false, zeroFill: false }))
			: undefined
	}

}
