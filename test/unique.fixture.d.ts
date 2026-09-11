export declare class CaseCollision
{
	first:  string
	second: string
}

export declare class IndexedRecord
{
	pairKey:   string
	related:   RelatedRecord
	sourceKey: string
	tenantKey: string
}

export declare class PrimaryCollision
{
	value: string
}

export declare class RelatedRecord
{
	code: string
}

export declare class RelationCollision
{
	related: RelatedRecord
	value:   string
}

export declare class RepresentativeCollision
{
	value: string
}
