import { Type }             from '@itrocks/class-type'
import { representativeOf } from '@itrocks/class-view'
import { ReflectClass }     from '@itrocks/reflect'
import { toColumn }         from '@itrocks/rename'
import { Index }            from '@itrocks/schema'
import { IndexKey }         from '@itrocks/schema'
import { ToType }           from './to-type'

export class ToIndex<T extends object>
{
	toType = new ToType()

	convertId(): Index
	{
		return new Index(
			'PRIMARY',
			new IndexKey('id'),
			{ type: 'primary', unique: true }
		)
	}

	convertIds(type: Type<T>): Index[]
	{
		const indexes = new Array<Index>
		for (const property of new ReflectClass(type).properties) {
			if (this.toType.isId(property)) {
				const columnName = toColumn(property.name) + (this.toType.isId(property) ? '_id' : '_')
				indexes.push(new Index(columnName, new IndexKey(columnName)))
			}
		}
		return indexes
	}

	convertRepresentative(type: Type<T>): Index | undefined
	{
		const index          = new Index('representative')
		const properties     = new ReflectClass(type).property
		const representative = representativeOf(type)
		for (const propertyName of representative) {
			const property   = properties[propertyName]
			const columnName = toColumn(propertyName)
				+ (this.toType.isId(property) ? '_id' : '')
			index.keys.push(new IndexKey(columnName))
		}
		return index.keys.length ? index : undefined
	}

	convertMultiple(type: Type<T>): Index[]
	{
		const indexes        = [this.convertId()]
		const representative = this.convertRepresentative(type)
		if (representative) indexes.push(representative)
		indexes.push(...this.convertIds(type))
		return indexes
	}

}
