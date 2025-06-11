import { KeyOf }              from '@itrocks/class-type'
import { Type as TargetType } from '@itrocks/class-type'
import { lengthOf }           from '@itrocks/length'
import { maxLengthOf }        from '@itrocks/length'
import { precisionOf }        from '@itrocks/precision'
import { CollectionType }     from '@itrocks/property-type'
import { ReflectProperty }    from '@itrocks/reflect'
import { Type }               from '@itrocks/schema'
import { maxValueOf }         from '@itrocks/value'
import { signedOf }           from '@itrocks/value'

export class ToType
{

	convert<T extends object>(property: ReflectProperty<T>)
	{
		const propertyType = property.type
		if (!propertyType) {
			throw 'Missing property type ' + property.name
		}
		const propertyName = property.name
		const target       = property.class.type
		if (propertyType instanceof CollectionType) {
			if (propertyType.elementType === String) {
				return new Type('set', {
					collate: 'utf8mb4_0900_ai_ci'
				})
			}
		}
		if (propertyType === Boolean) {
			return new Type('boolean')
		}
		if (propertyType === Date) {
			return new Type('datetime')
		}
		if (propertyType === Number) {
			const precision = precisionOf(target, propertyName)
			if (precision.maximum) {
				return new Type('float', {
					length:    this.length(target, propertyName, true),
					precision: precision.maximum,
					signed:    signedOf(target, propertyName)
				})
			}
			else {
				return new Type('integer', {
					length: this.length(target, propertyName, true),
					signed: signedOf(target, propertyName)
				})
			}
		}
		if (propertyType === String) {
			return new Type('string', {
				collate: 'utf8mb4_0900_ai_ci',
				length:  this.length(target, propertyName)
			})
		}
	}

	length<T extends object>(target: TargetType<T>, propertyName: KeyOf<T>, maxValue?: true)
	{
		return lengthOf(target, propertyName)
			?? maxLengthOf(target, propertyName)
			?? (maxValue && maxValueOf(target, propertyName)?.toString().length)
	}

	maxValueOf<T extends object>(target: TargetType<T>, propertyName: KeyOf<T>)
	{
		const maxValue = maxValueOf(target, propertyName)
		if (maxValue === undefined) return maxValue
		return ((typeof maxValue === 'number') ? Math.floor(maxValue) : maxValue).toString().length
	}

}
