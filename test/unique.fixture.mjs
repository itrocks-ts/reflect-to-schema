import { File }          from '@itrocks/class-file'
import { fileURLToPath } from 'node:url'

export class CaseCollision
{
	first  = ''
	second = ''
}

export class IndexedRecord
{
	pairKey   = ''
	related   = new RelatedRecord()
	sourceKey = ''
	tenantKey = ''
}

export class PrimaryCollision
{
	value = ''
}

export class RelatedRecord
{
	code = ''
}

export class RelationCollision
{
	related = new RelatedRecord()
	value   = ''
}

export class RepresentativeCollision
{
	value = ''
}

File(fileURLToPath(import.meta.url))(CaseCollision)
File(fileURLToPath(import.meta.url))(IndexedRecord)
File(fileURLToPath(import.meta.url))(PrimaryCollision)
File(fileURLToPath(import.meta.url))(RelatedRecord)
File(fileURLToPath(import.meta.url))(RelationCollision)
File(fileURLToPath(import.meta.url))(RepresentativeCollision)
