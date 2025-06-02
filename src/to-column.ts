import { Column }             from '@itrocks/table-schema'
import { Type }               from '@itrocks/table-schema'
import { Type as TargetType } from '@itrocks/class-type'
import { ReflectClass }       from '@itrocks/reflect'
import { ReflectProperty }    from '@itrocks/reflect'
import { toColumn }           from '@itrocks/rename'
import { ToType }             from './to-type'

export class ToColumn
{
	toType = new ToType()

	convertMultiple<T extends object = object>(type: TargetType<T>): Column[]
	{
		const columns = [new Column('id', new Type('integer'), { autoIncrement: true })]
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
		if (!type) return
		return new Column(toColumn(property.name), type)
	}

}
