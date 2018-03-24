update categories t
join (
	select id, (@rn := @rn + 1) as rn
	from categories
	cross join (
		select @rn := 0
	) const
	order by parent_oid, name
) x
on t.id = x.id
set t.oid = x.rn;

update categories t
join categories x
on t.parent_id = x.id
set t.parent_oid = x.oid;

select * from categories order by oid;
