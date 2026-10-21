import io
from PIL import Image,ImageOps,ImageCms

def open_srgb(path):
    source=Image.open(path)
    profile=source.info.get('icc_profile')
    oriented=ImageOps.exif_transpose(source)
    details={'source_icc_name':None,'converted_to_srgb':False,'untagged_assumed_srgb':not bool(profile)}
    if profile:
        embedded=ImageCms.ImageCmsProfile(io.BytesIO(profile))
        details['source_icc_name']=ImageCms.getProfileName(embedded).strip()
        working=oriented if oriented.mode in ('RGB','CMYK','LAB') else oriented.convert('RGB')
        oriented=ImageCms.profileToProfile(working,embedded,ImageCms.createProfile('sRGB'),renderingIntent=0,outputMode='RGB')
        details['converted_to_srgb']=True
    else:
        oriented=oriented.convert('RGB')
    return Image.frombytes('RGB',oriented.size,oriented.tobytes()),details
