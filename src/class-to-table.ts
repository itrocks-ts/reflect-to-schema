import { Type }     from '@itrocks/class-type'
import { storeOf }  from '@itrocks/store'
import { Table }    from '@itrocks/table-schema'
import { ToColumn } from './to-column'
import { ToIndex }  from './to-index'

export class ClassToTable
{

	toColumn = new ToColumn()
	toIndex  = new ToIndex()

	convert(type: Type)
	{
		const name = storeOf(type)
		if (!name) {
			throw 'Type not stored ' + type
		}
		return new Table(name, {
			collation: 'utf8mb4_0900_ai_ci',
			columns:   this.toColumn.convertMultiple(type),
			engine:    'InnoDB',
			indexes:   this.toIndex.convertMultiple(type)
		})
	}

}
