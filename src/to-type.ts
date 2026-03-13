import { Type as TargetType } from '@itrocks/class-type'
import { lengthOf }           from '@itrocks/length'
import { maxLengthOf }        from '@itrocks/length'
import { precisionOf }        from '@itrocks/precision'
import { CollectionType }     from '@itrocks/property-type'
import { TypeType }           from '@itrocks/property-type'
import { rangeOf }            from '@itrocks/range'
import { ReflectProperty }    from '@itrocks/reflect'
import { Type }               from '@itrocks/schema'
import { maxValueOf }         from '@itrocks/value'
import { signedOf }           from '@itrocks/value'

export class ToType
{

	convert<T extends object>(property: ReflectProperty<T>)
	{
		const propertyType = property.type
		const type         = propertyType?.type
		if (!type) {
			throw 'Missing property type ' + property.name.toString()
		}
		const propertyName = property.name
		const target       = property.class.type
		if (propertyType instanceof CollectionType) {
			if (propertyType.elementType.type === String) {
				return new Type('set', {
					collate: 'utf8mb4_0900_ai_ci'
				})
			}
		}
		if (type === BigInt) {
			const length = this.length(target, propertyName, true)
			return Type.integer(
				maxValueOf(target, propertyName) as bigint
					?? rangeOf(target, propertyName)?.maxValue
					?? (length ? ((10n ** BigInt(length)) - 1n) : undefined),
				signedOf(target, propertyName),
				{ length: length }
			)
		}
		if (type === Boolean) {
			return new Type('boolean')
		}
		if (type === Date) {
			return Type.date({ length: 10 })
		}
		if (type === Number) {
			const precision = precisionOf(target, propertyName)
			if (precision.maximum) {
				return Type.decimal(
					this.length(target, propertyName, true) ?? 65,
					precision.maximum,
					signedOf(target, propertyName)
				)
			}
			else {
				const length = this.length(target, propertyName, true)
				return Type.integer(
					maxValueOf(target, propertyName) as number
						?? rangeOf(target, propertyName)?.maxValue
						?? (length ? ((10 ** length) - 1) : undefined)
						?? Number.MAX_SAFE_INTEGER,
					signedOf(target, propertyName),
					{ length: length ?? Number.MAX_SAFE_INTEGER.toString().length }
				)
			}
		}
		if (type === String) {
			const length = this.length(target, propertyName, false) ?? 255
			return Type.string(length, ((length > 3) && (length < 256)) ? true : false, 'utf8mb4_0900_ai_ci')
		}
	}

	isId<T extends object>(property: ReflectProperty<T>, type?: Type)
	{
		return (property.type instanceof TypeType) && !(type ?? this.convert(property))
	}

	length<T extends object>(target: TargetType<T>, propertyName: keyof T, maxValue: boolean)
	{
		return (maxValue ? maxValueOf(target, propertyName)?.toString().length : undefined)
			?? (maxValue ? rangeOf(target, propertyName)?.maxValue.toString().length : undefined)
			?? lengthOf(target, propertyName)
			?? maxLengthOf(target, propertyName)
	}

}
