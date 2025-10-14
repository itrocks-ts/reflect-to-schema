import { Type }             from '@itrocks/class-type'
import { representativeOf } from '@itrocks/class-view'
import { ReflectClass }     from '@itrocks/reflect'
import { toColumn }         from '@itrocks/rename'
import { Index }            from '@itrocks/schema'
import { IndexKey }         from '@itrocks/schema'
import { ToType }           from './to-type'

export class ToIndex
{
	toType = new ToType()

	convertId(): Index
	{
		return new Index(
			'PRIMARY',
			[new IndexKey('id')],
			{ type: 'primary', unique: true }
		)
	}

	convertRepresentative(type: Type): Index | undefined
	{
		const index          = new Index('representative')
		const properties     = new ReflectClass(type).properties
		const representative = representativeOf(type)
		for (const propertyName of representative) {
			const property   = properties[propertyName]
			const columnName = toColumn(propertyName)
				+ (this.toType.isId(property) ? '_id' : '')
			index.keys.push(new IndexKey(columnName))
		}
		return index.keys.length ? index : undefined
	}

	convertMultiple(type: Type): Index[]
	{
		const id             = this.convertId()
		const representative = this.convertRepresentative(type)
		return representative ? [id, representative] : [id]
	}

}
