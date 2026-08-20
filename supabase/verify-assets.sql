-- Lists LUT asset paths that do not match an object in the private bucket.
select
  l.id,
  l.title,
  l.file_url,
  o.name as storage_object
from public.luts l
left join storage.objects o
  on o.bucket_id = 'lut-assets'
 and o.name = l.file_url
where l.file_url is not null
  and o.name is null
order by l.title;

-- Lists private LUT objects that are not referenced by a catalog row.
select
  o.name as storage_object
from storage.objects o
left join public.luts l
  on l.file_url = o.name
where o.bucket_id = 'lut-assets'
  and l.id is null
order by o.name;