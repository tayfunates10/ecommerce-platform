BEGIN;
TRUNCATE "Product","ProductVariant","ProductTranslation","ProductMedia","Price","Inventory" CASCADE;

-- P1: fully translated, in stock, with image, long name
INSERT INTO "Product" (id,slug,sku,status,brand,"createdAt","updatedAt") VALUES
 ('p1','aurora-kablosuz-kulaklik','SKU-AURORA','ACTIVE','Aurora',NOW(),NOW()),
 ('p2','nimbus-laptop-stand','SKU-NIMBUS','ACTIVE','Nimbus',NOW(),NOW()),
 ('p3','vertex-mekanik-klavye','SKU-VERTEX','ACTIVE','Vertex',NOW(),NOW()),
 ('p4','solis-tr-only-urun','SKU-SOLIS','ACTIVE','Solis',NOW(),NOW()),
 ('p5','zenith-no-image','SKU-ZENITH','ACTIVE',NULL,NOW(),NOW());

INSERT INTO "ProductTranslation" (id,"productId",locale,name,description,"shortCopy") VALUES
 ('t1a','p1','TR','Aurora Kablosuz Kulaklık','Aktif gürültü engelleme ve 40 saat pil ömrü sunan kablosuz kulaklık.','40 saat pil, ANC'),
 ('t1b','p1','EN','Aurora Wireless Headphones','Wireless headphones with active noise cancelling and 40 hours of battery life.','40h battery, ANC'),
 ('t1c','p1','DE','Aurora Kabellose Kopfhörer','Kabellose Kopfhörer mit aktiver Geräuschunterdrückung und 40 Stunden Akkulaufzeit.','40 Std Akku, ANC'),
 ('t2a','p2','TR','Nimbus Laptop Standı','Alüminyum, yüksekliği ayarlanabilir laptop standı.','Ayarlanabilir'),
 ('t2b','p2','EN','Nimbus Laptop Stand','Aluminium height-adjustable laptop stand.','Adjustable'),
 ('t2c','p2','DE','Nimbus Laptop-Ständer','Höhenverstellbarer Laptop-Ständer aus Aluminium.','Verstellbar'),
 ('t3a','p3','TR','Vertex Mekanik Klavye','Hot-swap destekli, RGB aydınlatmalı mekanik klavye.','Hot-swap, RGB'),
 ('t3b','p3','EN','Vertex Mechanical Keyboard','Hot-swappable mechanical keyboard with RGB lighting.','Hot-swap, RGB'),
 ('t3c','p3','DE','Vertex Mechanische Tastatur','Hot-Swap-fähige mechanische Tastatur mit RGB-Beleuchtung.','Hot-Swap, RGB'),
 -- p4 has ONLY a Turkish translation (real-world partial translation case)
 ('t4a','p4','TR','Solis Masa Lambası','Sadece Türkçe çevirisi olan ürün.','Yalnızca TR'),
 -- p5 translated in all locales but has no media
 ('t5a','p5','TR','Zenith Görselsiz Ürün','Görseli olmayan ürün kaydı.',NULL),
 ('t5b','p5','EN','Zenith Product Without Image','A product record that has no media attached.',NULL),
 ('t5c','p5','DE','Zenith Produkt ohne Bild','Ein Produktdatensatz ohne Medien.',NULL);

INSERT INTO "ProductVariant" (id,"productId",sku,title,attributes,active,"createdAt","updatedAt") VALUES
 ('v1','p1','SKU-AURORA-BLK','Siyah','{}',true,NOW(),NOW()),
 ('v2','p2','SKU-NIMBUS-STD',NULL,'{}',true,NOW(),NOW()),
 ('v3','p3','SKU-VERTEX-TKL','TKL','{}',true,NOW(),NOW()),
 ('v4','p4','SKU-SOLIS-STD',NULL,'{}',true,NOW(),NOW()),
 ('v5','p5','SKU-ZENITH-STD',NULL,'{}',true,NOW(),NOW());

-- prices in all three currencies
INSERT INTO "Price" (id,"variantId",currency,amount,"validFrom") VALUES
 ('pr1','v1','TRY',4999.90,NOW()),('pr2','v1','USD',149.90,NOW()),('pr3','v1','EUR',139.90,NOW()),
 ('pr4','v2','TRY',1299.00,NOW()),('pr5','v2','USD',39.00,NOW()),('pr6','v2','EUR',36.00,NOW()),
 ('pr7','v3','TRY',3450.50,NOW()),('pr8','v3','USD',99.99,NOW()),('pr9','v3','EUR',94.50,NOW()),
 ('pr10','v4','TRY',899.00,NOW()),
 ('pr11','v5','TRY',249.00,NOW()),('pr12','v5','USD',9.90,NOW()),('pr13','v5','EUR',8.90,NOW());

-- inventory: p1 plenty, p2 exactly 2 left, p3 OUT OF STOCK, p4 plenty, p5 plenty
INSERT INTO "Inventory" (id,"variantId",quantity,reserved,"reorderAt","updatedAt") VALUES
 ('i1','v1',120,5,10,NOW()),
 ('i2','v2',2,0,1,NOW()),
 ('i3','v3',3,3,1,NOW()),
 ('i4','v4',50,0,5,NOW()),
 ('i5','v5',10,0,2,NOW());

INSERT INTO "ProductMedia" (id,"productId",url,alt,"mimeType",width,height,"sortOrder","isPrimary") VALUES
 ('m1','p1','/media/aurora.png','Aurora kablosuz kulaklık ürün görseli','image/png',1200,1200,0,true),
 ('m2','p2','/media/nimbus.png','Nimbus laptop standı ürün görseli','image/png',1200,1200,0,true),
 ('m3','p3','/media/vertex.png','Vertex mekanik klavye ürün görseli','image/png',1200,1200,0,true),
 ('m4','p4','/media/solis.png',NULL,'image/png',1200,1200,0,true);
COMMIT;
