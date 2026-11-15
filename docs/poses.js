// User-selected artwork. The archive already contains separate mirrored variants.
const variants = {
 lunge:'lunge', half:'half', figure:'figure', recline:'hamstring',
 quad:'quad', fold:'hinge', frog:'frog', adductor:'adductor', side:'side',
 butterfly:'butterfly', wide:'wide'
};
const bilateral=new Set(['fold','frog','butterfly','wide']);
export function pose(name,mirror=false){
 const key=Object.hasOwn(variants,name)?name:'wide';
 const side=bilateral.has(key)?'both':mirror?'right':'left';
 return `<img class="stretch-art" src="./illustrations/${variants[key]}-${side}.png" alt="" aria-hidden="true" width="348" height="348" decoding="async">`;
}

// Supplied PNG pairs. Explicit maps preserve the existing pack's facing convention
// where filenames in the new pack use a different mirrored orientation.
const routineImages={
 half:['hamstring-flexed-foot.png','hamstring-flexed-foot.png'],
 lunge90:['90-lunge.png','90-lunge-mirrored.png'],
 lungeGrab:['90-lunge-ankle-grab.png','90-lunge-ankle-grab-mirrored.png'],
 deepLunge:['deep-lunge-half-split.png','deep-lunge-half-split-mirrored.png'],
 deepGrab:['deep-lunge-ankle-grab.png','deep-lunge-ankle-grab-mirrored.png'],
 kneeTaps:['back-knee-taps.png','back-knee-taps-mirrored.png'],
 hamPoint:['hamstring-pointed-foot.png','hamstring-pointed-foot-mirrored.png'],
 pyramid:['pyramid-pose-mirrored.png','pyramid-pose.png'],
 goodMornings:['pyramid-good-mornings.png','pyramid-good-mornings-mirrored.png'],
 frontSplit:['supported-front-split-mirrored.png','supported-front-split.png']
};
export function routinePose(name,mirror=false){
 if(Object.hasOwn(routineImages,name))return `<img class="stretch-art${name==='half'&&!mirror?' art-mirrored':''}" src="./illustrations/${routineImages[name][mirror?1:0]}" alt="" aria-hidden="true" width="348" height="348" decoding="async">`;
 return Object.hasOwn(variants,name)?pose(name,mirror):'<div class="art-pending">Demonstration linked below</div>';
}
