import assert                              from 'node:assert/strict'
import test                                from 'node:test'
import { Representative }                  from '@itrocks/class-view'
import { Store }                           from '@itrocks/store'
import { Unique }                          from '@itrocks/unique'
import { ReflectToTable }                  from '../cjs/reflect-to-schema.js'
import { CaseCollision }                   from './unique.fixture.mjs'
import { IndexedRecord }                   from './unique.fixture.mjs'
import { PrimaryCollision }                from './unique.fixture.mjs'
import { RelatedRecord }                   from './unique.fixture.mjs'
import { RelationCollision }               from './unique.fixture.mjs'
import { RepresentativeCollision }         from './unique.fixture.mjs'

test('ReflectToTable converts Unique metadata into named unique indexes', function()
{
	Store('friendship')(IndexedRecord)
	Store('related')(RelatedRecord)
	Unique()(IndexedRecord.prototype, 'pairKey')
	Unique()(IndexedRecord.prototype, 'related')
	Unique('origin')(IndexedRecord.prototype, 'sourceKey')
	Unique('origin')(IndexedRecord.prototype, 'tenantKey')

	const indexes = new ReflectToTable().convert(IndexedRecord).indexes
	const unique  = indexes
		.filter(index => index.type === 'unique')

	assert.deepEqual(
		unique.map(index => ({
			columns: index.keys.map(key => key.columnName),
			name:    index.name,
			type:    index.type,
			unique:  index.unique
		})),
		[
			{ columns: ['pair_key'], name: 'pair_key', type: 'unique', unique: true },
			{ columns: ['related_id'], name: 'related_id', type: 'unique', unique: true },
			{
				columns: ['source_key', 'tenant_key'],
				name:    'origin',
				type:    'unique',
				unique:  true
			}
		]
	)
	assert.equal(indexes.filter(index => index.name === 'related_id').length, 1)
})

test('ReflectToTable rejects Unique names differing only by case', function()
{
	Store('case_collision')(CaseCollision)
	Unique('identity')(CaseCollision.prototype, 'first')
	Unique('IDENTITY')(CaseCollision.prototype, 'second')

	assert.throws(
		() => new ReflectToTable().convert(CaseCollision),
		error => (error instanceof RangeError) && /Unique index name conflicts/.test(error.message)
	)
})

test('ReflectToTable rejects Unique names reserved by generated indexes', function()
{
	Store('primary_collision')(PrimaryCollision)
	Unique('PRIMARY')(PrimaryCollision.prototype, 'value')

	Store('relation_collision')(RelationCollision)
	Unique('related_id')(RelationCollision.prototype, 'value')

	Store('representative_collision')(RepresentativeCollision)
	Representative('value')(RepresentativeCollision)
	Unique('representative')(RepresentativeCollision.prototype, 'value')

	for (const type of [PrimaryCollision, RelationCollision, RepresentativeCollision]) {
		assert.throws(
			() => new ReflectToTable().convert(type),
			error => (error instanceof RangeError) && /Unique index name conflicts/.test(error.message)
		)
	}
})
