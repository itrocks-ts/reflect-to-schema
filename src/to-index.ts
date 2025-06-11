import { Type }             from '@itrocks/class-type'
import { representativeOf } from '@itrocks/class-view'
import { toColumn }         from '@itrocks/rename'
import { Index }            from '@itrocks/schema'
import { IndexKey }         from '@itrocks/schema'

export class ToIndex
{

	convertId(): Index
	{
		return new Index(
			'id',
			[new IndexKey('id')],
			{ type: 'primary', unique: true }
		)
	}

	convertRepresentative(type: Type): Index
	{
		const index = new Index('representative')
		const representative: string[] = representativeOf(type)
		for (const propertyName of representative) {
			index.keys.push(new IndexKey(toColumn(propertyName)))
		}
		return index
	}

	convertMultiple(type: Type): Index[]
	{
		return [this.convertId(), this.convertRepresentative(type)]
	}

}
