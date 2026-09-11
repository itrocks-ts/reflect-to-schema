import { Type }             from '@itrocks/class-type'
import { representativeOf } from '@itrocks/class-view'
import { ReflectClass }     from '@itrocks/reflect'
import { toColumn }         from '@itrocks/rename'
import { Index }            from '@itrocks/schema'
import { IndexKey }         from '@itrocks/schema'
import { uniqueOf }         from '@itrocks/unique'
import { ToType }           from './to-type'

const RESERVED_INDEX_NAMES = new Set(['primary', 'representative'])

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

	convertMultiple(type: Type<T>): Index[]
	{
		const indexes        = [this.convertId()]
		const representative = this.convertRepresentative(type)
		if (representative) indexes.push(representative)
		indexes.push(...this.convertIds(type))
		const uniqueIndexes = this.convertUnique(type)
		for (const unique of uniqueIndexes) {
			const uniqueName    = unique.name.toLowerCase()
			if (RESERVED_INDEX_NAMES.has(uniqueName)) {
				throw new RangeError(`Unique index name conflicts with a reserved schema index: ${unique.name}`)
			}
			const indexPosition = indexes.findIndex(index => index.name.toLowerCase() === uniqueName)
			if (indexPosition < 0) continue
			const index    = indexes[indexPosition]
			const sameKeys = (index.keys.length === unique.keys.length)
				&& index.keys.every((key, position) => (key.columnName === unique.keys[position].columnName)
					&& (key.length === unique.keys[position].length))
			if ((index.type !== 'key') || !sameKeys) {
				throw new RangeError(`Unique index name conflicts with another schema index: ${index.name}`)
			}
			indexes.splice(indexPosition, 1)
		}
		indexes.push(...uniqueIndexes)
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

	convertUnique(type: Type<T>): Index[]
	{
		const indexes         = new Map<string, Index>
		const normalizedNames = new Map<string, string>
		for (const property of new ReflectClass(type).properties) {
			const uniqueName = uniqueOf(type, property.name)
			if (uniqueName === false) continue
			const columnName     = toColumn(property.name) + (this.toType.isId(property) ? '_id' : '')
			const indexName      = uniqueName || columnName
			const normalizedName = indexName.toLowerCase()
			const registeredName = normalizedNames.get(normalizedName)
			if (registeredName && (registeredName !== indexName)) {
				throw new RangeError(`Unique index name conflicts with another unique schema index: ${indexName}`)
			}
			let index = indexes.get(indexName)
			if (!index) {
				index = new Index(indexName, [], { type: 'unique', unique: true })
				indexes.set(indexName, index)
				normalizedNames.set(normalizedName, indexName)
			}
			index.keys.push(new IndexKey(columnName))
		}
		return [...indexes.values()]
	}

}
